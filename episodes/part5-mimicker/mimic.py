# creepy "mimicked mother" voice clips (Kokoro female voice, detuned + doubled + reverb) -> data/mimic_k.wav
import numpy as np, sys
from pathlib import Path
from scipy.io import wavfile
from kokoro_onnx import Kokoro
K=Path.home()/'.faceless-shorts/kokoro'; k=Kokoro(str(K/'kokoro-v1.0.onnx'),str(K/'voices-v1.0.bin'))
LINES={'1':("Sweetie? ... Where are you?",0.85),'2':("Honey... it's Mom. Let me in.",0.8),'3':("Please... answer me.",0.78)}
for key,(txt,sp) in LINES.items():
    x,sr=k.create(txt,voice='af_heart',speed=sp,lang='en-us'); x=np.asarray(x,dtype=np.float64)
    i=np.where(np.abs(x)>0.01*np.abs(x).max())[0]; x=x[max(0,i[0]-100):i[-1]+400]
    wavfile.write(f'data/mimic_{key}.wav',sr,(x/np.abs(x).max()*0.9*32767).astype(np.int16)); print(key,len(x)/sr)
