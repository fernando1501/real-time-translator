import { useEffect, useState } from 'react';
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
