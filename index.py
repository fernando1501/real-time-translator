from googletrans import Translator
from flask import Flask, render_template, request, send_from_directory
from flask_cors import CORS
import os
import json
current_text = ''
langs = ['es', 'en']

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

# @app.route("/")
# def index():
#     global current_text
#     return render_template('index.html', current_text=current_text)

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

if __name__ == "__main__":
    app.run(port=4000)
