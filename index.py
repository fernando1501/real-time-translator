from googletrans import Translator
from flask import Flask, render_template, request, send_from_directory
from flask_cors import CORS
from threading import Thread
import os
import json
import speech_recognition as sr
current_text = ''
langs = ['es', 'en']

recognizer = sr.Recognizer()

recognizer.energy_threshold = 300
recognizer.phrase_time_limit = 15

translator = Translator()

def getJsonFile(name):
    with open(name, 'r') as fcc_file:
        fcc_data = json.load(fcc_file)
        return fcc_data

app = Flask(__name__, static_folder='build')

CORS(app)


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

@app.route('/translate', methods=['GET', 'DELETE'])
def translate():
    global current_text
    if request.method == 'GET':
        configData = getJsonFile('config.json')
        text = request.args.get("text")
        translated = translator.translate(text, src=configData["src_lang"], dest=configData["target_lang"])
        current_text = translated.text
        return {
            "translated": translated.text
        }
    else:
        current_text = ""
        return {}

@app.route('/exit')
def exit():
    os._exit(1)


@app.route("/config", methods=['POST', 'GET'])
def config():
    if request.method == 'POST':
        jsonData = request.json
        configData = getJsonFile('config.json')
        configData[jsonData["name"]] = jsonData["value"]
        with open("config.json", "w") as outfile:
            outfile.write(json.dumps(configData))
        return {}
    else:
        configData = getJsonFile('config.json')
        return configData

@app.route("/text", methods=['GET'])
def getText():
    return {
        "text": current_text
    }

@app.route('/mics', methods=['GET'])
def get_microphones():
    micsIntern = []
    microphones = sr.Microphone.list_working_microphones()
    for device_index, name in enumerate(sr.Microphone.list_microphone_names()):
        micsIntern.append({
            "id": str(device_index),
            "name": name,
        })
    return {
        "microphones": micsIntern
    }

def main():
    configData = getJsonFile('config.json')
    global current_text
    if configData.get('deviceId') != None:
        mic = sr.Microphone(device_index=int(configData.get('deviceId')))
    else:
        mic = sr.Microphone()
    with mic as source:
        recognizer.adjust_for_ambient_noise(source)
        while True:
            try:
                recorded_audio = recognizer.listen(source)
                text = recognizer.recognize_google(
                    recorded_audio,
                    language=configData["src_lang"])
                translated = translator.translate(
                    text, src=configData["src_lang"], dest=configData["target_lang"]
                )
                current_text = translated.text
            except Exception as e:
                current_text = ''

class CustomThread(Thread):
    def run(self):
        while True:
            main()

if __name__ == "__main__":
    thread = CustomThread()
    thread.start()
    app.run(port=4000)
