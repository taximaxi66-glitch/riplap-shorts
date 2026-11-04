import json, sys, re, numpy as np, librosa
from pathlib import Path
from scipy.io import wavfile
from kokoro_onnx import Kokoro
SR=24000; K=Path.home()/'.faceless-shorts/kokoro'
P=Path(sys.argv[1]); S=json.loads((P/'script.json').read_text())
k=Kokoro(str(K/'kokoro-v1.0.onnx'),str(K/'voices-v1.0.bin'))
def trim(x,thr=0.01):
    i=np.where(np.abs(x)>thr*np.abs(x).max())[0]; return x[max(0,i[0]-120):i[-1]+600]
def say(t,sp): return trim(np.asarray(k.create(t,voice=S['voice'],speed=sp,lang='en-us')[0],dtype=np.float64))
norm=lambda w: re.sub(r"[^a-z0-9']+","",w.lower())
def feat(x): 
    m=librosa.feature.mfcc(y=x.astype(np.float32),sr=SR,n_mfcc=20,hop_length=240,n_fft=1024)
    return (m-m.mean(1,keepdims=True))/(m.std(1,keepdims=True)+1e-6)
out=[np.zeros(int(S['lead']*SR))]; t=S['lead']; lines=[]; words=[]
for li,ln in enumerate(S['lines']):
    x=say(ln['text'],ln['speed']); n=len(x)/SR
    toks=[w for w in ln['text'].split() if norm(w)]
    # template: isolated words
    segs=[say(re.sub(r'[^A-Za-z0-9\']','',w) if norm(w)!='am' else 'A.M.',ln['speed']) for w in toks]
    bounds=np.cumsum([0]+[len(s) for s in segs])
    tmpl=np.concatenate(segs)
    A=feat(tmpl); B=feat(x)
    D,wp=librosa.sequence.dtw(X=A,Y=B,metric='euclidean'); wp=wp[::-1]
    def mapf(fr):
        c=wp[wp[:,0]>=fr]; return (c[0,1] if len(c) else wp[-1,1])*240/SR
    ws=[]
    for j,w in enumerate(toks):
        s=mapf(bounds[j]/240); e=mapf(bounds[j+1]/240-1)
        ws.append([s,e])
    ws[0][0]=min(ws[0][0],0.03)
    for j,(w,(s,e)) in enumerate(zip(toks,ws)):
        words.append({'w':w,'line':li,'s':round(t+s,3),'e':round(t+max(e,s+0.06),3)})
    lines.append({'i':li,'id':ln['id'],'text':ln['text'],'start':round(t,3),'end':round(t+n,3)})
    print(f"{li:2d} {t:6.2f}-{t+n:6.2f} {ln['text']}")
    g=np.zeros(int(ln['gap']*SR)); out+=[x,g]; t+=n+ln['gap']
out.append(np.zeros(int(S['outro']*SR)))
y=np.concatenate(out); y=y/np.abs(y).max()*0.9
wavfile.write(P/'data/narration.wav',SR,(y*32767).astype(np.int16))
dur=len(y)/SR
(P/'data/timing.json').write_text(json.dumps({'duration':dur,'lines':lines,'words':words},indent=0))
(P/'data/words.txt').write_text('\n'.join(f"{w['s']:7.2f} {w['e']:7.2f} L{w['line']:<2d} {w['w']}" for w in words))
print('dur',dur)
