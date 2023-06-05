import { useEffect, useState } from 'react';
import styled from 'styled-components';
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

export const Home = () => {
    const [transcript, setTranscript] = useState()

    useEffect(() => {
        const onChangeText = (data) => {
            setTranscript(data.current_text)
        }
        socket.on('change-text', onChangeText)
        return () => {
            socket.off('change-text', onChangeText)
        }
    }, [])

    return (
        <Container>
            {transcript && <Caption >{transcript}</Caption>}
        </Container>
    );
}
