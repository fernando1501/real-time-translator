import styled from "styled-components"
import { langs } from "../utils/langs"
import { useEffect, useState } from "react"
import { getBaseUrl } from "../utils"

const FormGroup = styled("div")``
const Selector = styled("select")``
const Option = styled("option")``

export const Config = () => {
    const [mics, setMics] = useState([])
    const [form, setForm] = useState({
        src_lang: '',
        target_lang: '',
        deviceId: '',
    })
    const onChange = ({ target }) => {
        setForm((prev) => ({ ...prev, [target.name]: target.value }))
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
        const getMics = async () => {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioDevices = devices.filter((device) => device.kind === 'audioinput');
            setMics(audioDevices)
        }
        fetch(`${getBaseUrl()}/config`)
            .then((data) => data.json())
            .then((result) => {
                setForm((prev) => ({ ...prev, ...result }))
            })

        getMics()
    }, [])

    return (
        <>
            <FormGroup>
                <label>Idioma original</label>
                <Selector value={form.src_lang} name="src_lang" onChange={onChange}>
                    {langs.map(({ label, value }) => (
                        <Option value={value}>{label}</Option>
                    ))}
                </Selector>
            </FormGroup>
            <FormGroup>
                <label>Idioma objetivo</label>
                <Selector value={form.target_lang} name="target_lang" onChange={onChange}>
                    {langs.map(({ label, value }) => (
                        <Option value={value}>{label}</Option>
                    ))}
                </Selector>
            </FormGroup>
            <FormGroup>
                <label>Microfono</label>
                <Selector value={form.deviceId} name="deviceId" onChange={onChange}>
                    {mics.map(({ label, deviceId }) => (
                        <Option value={deviceId}>{label}</Option>
                    ))}
                </Selector>
            </FormGroup>
        </>
    )
}