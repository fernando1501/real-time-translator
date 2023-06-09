import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { getBaseUrl, langs } from '../utils';
import { socket } from '../utils/sockets';

const Container = styled.div`
  width: 100%;
  ${p => p.isObs ? `
    position: absolute;
    ` : `
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  `}
  bottom: 0;
`;

const Text = styled.p`
  font-size: 18px;
  text-align: center;
  margin-bottom: 20px;
`;

const ExternalLink = styled.a`
  color: #333;
  text-decoration: none;
  margin: 5px;
`;

const Caption = styled.div`
  font-family: sans-serif;
  font-weight: normal;
  font-size: clamp(1.2em, 3em, 5em);
  color: white;
  background: rgba(0, 0, 0, 0.4);
  padding: 2vmin;
  border-radius: 4vmin;
`;

const Button = styled.button`
    padding: 10px 20px;
    background-color: ${props => props.active ? '#00cc00' : '#cc0000'};
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    margin: 20px 0;
`


const CopyContainer = styled.div`
  display: flex;
  align-items: center;
  width: 300px;
`;

const CopyInput = styled.input`
  flex-grow: 1;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
`;

const CopyButton = styled.button`
  margin-left: 10px;
  padding: 10px 20px;
  background-color: #333;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
`;

const FormGroup = styled("div")``
const Selector = styled("select")``
const Option = styled("option")``

export const Home = () => {
    const [active, setActive] = useState(false)
    const [configs, setConfigs] = useState({
        src_lang: '',
        target_lang: '',
    })
    const [transcript, setTranscript] = useState()
    const [recognition, setRecognition] = useState(null);
    const [isObs, setIsObs] = useState(null)
    const timeOut = useRef()
    const inputRef = useRef()

    const onChange = ({ target }) => {
        setConfigs((prev) => ({ ...prev, [target.name]: target.value }))
        fetch(`${getBaseUrl()}/config`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: target.name,
                value: target.value,
            }),
        }).then(() => { });
    };

    useEffect(() => {
        setIsObs(typeof window.obsstudio !== 'undefined')
        const getConfig = async () => {
            const configResponse = await fetch(`${getBaseUrl()}/config`);
            const result = await configResponse.json()
            setConfigs((prev) => ({ ...prev, ...result }))
        }

        getConfig()
    }, []);

    useEffect(() => {
        if (!isObs) {
            const cleanRecognizer = () => {
                if (recognition) {
                    recognition.stop();
                    recognition.onresult = null;
                    recognition.onend = null;
                    setRecognition(null);
                    setTranscript('');
                }
            }
            const startNewRegognition = () => {
                if (active) {
                    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
                    const newRecognition = new SpeechRecognition();
                    newRecognition.continuous = false;
                    newRecognition.interimResults = false;
                    newRecognition.lang = configs.src_lang;
                    newRecognition.onresult = async (event) => {
                        console.log('Nuevo reconocimiento de voz')
                        clearTimeout(timeOut.current)
                        const speechText = event.results[event.results.length - 1][0].transcript;
                        await fetch(`${getBaseUrl()}/translate`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                text: speechText,
                            }),
                        })
                    };
                    newRecognition.onend = () => {
                        console.log('Reconocimiento de voz finalizado');
                        cleanRecognizer()
                        startNewRegognition()
                    };
                    setRecognition(newRecognition);
                    newRecognition.start();
                }
            }
            cleanRecognizer()
            startNewRegognition()
        }
        // eslint-disable-next-line
    }, [configs.src_lang, active, isObs]);

    useEffect(() => {
        const cleanTranscription = () => {
            setTranscript('')
        }
        const calculateSilenceThreshold = (text) => {
            const averageWordsPerMinute = 120;
            const words = text.trim().split(' ');
            const wordCount = words.length;
            const minutes = wordCount / averageWordsPerMinute;
            const silenceThreshold = minutes * 60 * 1000;
            return silenceThreshold < 2000 ? 2000 : silenceThreshold;
        }
        const handleChangeText = ({ text }) => {
            setTranscript(text)
            const ms = calculateSilenceThreshold(text)
            timeOut.current = setTimeout(cleanTranscription, ms)
        }
        socket.on('change-text', handleChangeText)
        return () => {
            socket.off('change-text', handleChangeText);
        }
    }, [])

    const handleCopy = async () => {
        console.log(inputRef.current)
        await navigator.clipboard.writeText(inputRef.current.value);
    };

    return (
        <Container isObs={isObs}>
            {!isObs && (
                <>
                    <FormGroup>
                        <label>Idioma original</label>
                        <Selector value={configs.src_lang} name="src_lang" onChange={onChange}>
                            {langs.map(({ label, value }) => (
                                <Option value={value}>{label}</Option>
                            ))}
                        </Selector>
                    </FormGroup>
                    <FormGroup>
                        <label>Idioma objetivo</label>
                        <Selector value={configs.target_lang} name="target_lang" onChange={onChange}>
                            {langs.map(({ label, value }) => (
                                <Option value={value}>{label}</Option>
                            ))}
                        </Selector>
                    </FormGroup>
                    <Button active={active} onClick={() => setActive(!active)}>
                        {active ? 'Desactivar Micrófono' : 'Activar Micrófono'}
                    </Button>
                    {active && (
                        <>
                            <Text>
                                Agrega esta URL a un source browser en OBS y no cierres esta pestaña
                            </Text>
                            <CopyContainer>
                                <CopyInput onClick={handleCopy} ref={inputRef} value={window?.location} readOnly />
                                <CopyButton onClick={handleCopy}>Copiar</CopyButton>
                            </CopyContainer>
                        </>
                    )}
                    <Text>
                        Este software fue creado por Ferxho507. Recuerda seguirme en redes sociales para apoyar este tipo de herramientas:
                    </Text>
                    <div>
                        <ExternalLink href="https://www.youtube.com/@ferxho507" target="_blank" rel="noopener noreferrer">
                            YouTube: @ferxho507
                        </ExternalLink>
                        <ExternalLink href="https://www.twitch.tv/ferxho507" target="_blank" rel="noopener noreferrer">
                            Twitch @ferxho507
                        </ExternalLink>
                        <ExternalLink href="https://www.instagram.com/ferxhofamania/" target="_blank" rel="noopener noreferrer">
                            Instagram @ferxhofamania
                        </ExternalLink>
                        <ExternalLink href="https://twitter.com/ferxhofamania" target="_blank" rel="noopener noreferrer">
                            Twitter @ferxhofamania
                        </ExternalLink>
                        <ExternalLink href="https://www.tiktok.com/@ferxhofamania" target="_blank" rel="noopener noreferrer">
                            TikTok @ferxhofamania
                        </ExternalLink>
                    </div>
                </>
            )}
            {transcript && <Caption >{transcript}</Caption>}
        </Container>
    );
}
