import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { getBaseUrl } from '../utils';
import { socket } from '../utils/sockets';
const Container = styled.div`
  width: 100%;
  position: absolute;
  bottom: 0;
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
  background-color: ${props => (props.active ? '#00cc00' : '#cc0000')};
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
`;

export const Home = () => {
    const [active, setActive] = useState(false)
    const [configs, setConfigs] = useState({})
    const [transcript, setTranscript] = useState()
    const [recognition, setRecognition] = useState(null);
    const [isObs, setIsObs] = useState(null)
    const timeOut = useRef()

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
                if (recognition && !active) {
                    recognition.stop();
                    recognition.onresult = null;
                    recognition.onend = null;
                    setRecognition(null);
                    setTranscript('');
                }
            }
            const startNewRegognition = () => {
                if (active) {
                    const newRecognition = new window.webkitSpeechRecognition();
                    newRecognition.continuous = true;
                    newRecognition.interimResults = false;
                    newRecognition.lang = configs.src_lang;
                    newRecognition.onresult = async (event) => {
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
                        cleanRecognizer()
                        startNewRegognition()
                        console.log('Reconocimiento de voz finalizado');
                    };
                    setRecognition(newRecognition);
                    newRecognition.start();
                }
            }
            cleanRecognizer()
            startNewRegognition()
        }
        // eslint-disable-next-line
    }, [configs.src_lang, active]);

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
            return silenceThreshold;
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

    return (
        <Container>
            {!isObs && (
                <>
                    <Button active={active} onClick={() => setActive(!active)}>
                        {active ? 'Micrófono Activado' : 'Micrófono Desactivado'}
                    </Button>
                    {active && (
                        <p>
                            Agrega esta URL a un source browser en OBS y no cierres esta pestaña
                        </p>
                    )}
                </>
            )}
            {transcript && <Caption >{transcript}</Caption>}
        </Container>
    );
}
