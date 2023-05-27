import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { getBaseUrl } from '../utils';
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

export const Home = () => {
    const [transcript, setTranscript] = useState()
    const [transcriptRaw, setTranscriptRaw] = useState()
    const fetchSigal = useRef()
    const coolDowm = useRef()
    const resetRef = useRef()
    const [mics, setMics] = useState([])

    useEffect(() => {
        if (mics.length > 0) {
            fetch(`${getBaseUrl()}/config`)
                .then((data) => data.json())
                .then((result) => {
                    const recognition = window.SpeechRecognition ? new window.SpeechRecognition() : new window.webkitSpeechRecognition();
                    recognition.continuous = true
                    recognition.lang = result.src_lang || 'es'
                    recognition.interimResults = true

                    if (result.deviceId) {
                        const micExist = mics.some((mic) => mic.deviceId === result.deviceId)
                        if (micExist) {
                            recognition.audio = {
                                deviceId: result.deviceId,
                            };
                        }
                    }

                    recognition.onresult = (event) => {
                        const current = event.resultIndex;
                        const transcript = event.results[current][0].transcript;
                        setTranscriptRaw(transcript)
                    };

                    recognition.onerror = (event) => {
                        console.error(event.error);
                    };
                    recognition.onend = () => {
                        recognition.start()
                    };
                    recognition.start()
                })
        }
    }, [mics])

    useEffect(() => {
        const getMics = async () => {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioDevices = devices.filter((device) => device.kind === 'audioinput');
            setMics(audioDevices)
        }
        getMics()
    }, [])

    useEffect(() => {
        if (transcriptRaw !== undefined) {
            clearTimeout(coolDowm.current)
            clearTimeout(resetRef.current)
            if (fetchSigal.current) {
                fetchSigal.current.abort()
            }
            const controller = new AbortController()
            const signal = controller.signal
            fetchSigal.current = controller
            coolDowm.current = setTimeout(() => {
                fetch(`${getBaseUrl()}/translate?text=${transcriptRaw}`, { signal })
                    .then((data) => data.json()).then((result) => {
                        resetRef.current = setTimeout(() => {
                            fetch(`${getBaseUrl()}/translate`, { signal, method: 'DELETE' })
                        }, result.translated.length * 200)
                    })
            }, 500)
        }
    }, [transcriptRaw])

    useEffect(() => {
        const getTextFile = () => {
            fetch(`${getBaseUrl()}/text`)
                .then((result) => result.json())
                .then(({ text }) => {
                    setTranscript(text)
                    setTimeout(getTextFile, 200)
                })
        }
        getTextFile()
    }, [])

    return (
        <Container>
            {transcript && <Caption >{transcript}</Caption>}
        </Container>
    );
}
