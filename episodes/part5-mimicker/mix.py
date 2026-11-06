import json, numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt, fftconvolve
SR = 44100
rs = np.random.RandomState(3)
T = json.load(open('data/timing.json')); CUES = json.load(open('data/cues.json'))
DUR = T['duration']; N = int(DUR * SR) + SR
def t_(d): return np.arange(int(d * SR)) / SR
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, a, b, o=2): return sosfilt(butter(o, [a, b], 'band', fs=SR, output='sos'), x)
def env(n, a, d):  # attack / exp decay
    t = np.arange(n) / SR; return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)
def noise(d): return rs.randn(int(d * SR))
def norm(x, p=1.0): return x / (np.abs(x).max() + 1e-9) * p
IR = noise(2.6) * np.exp(-np.arange(int(2.6 * SR)) / SR / 0.6); IR = lp(IR, 5000); IR /= np.abs(IR).sum() ** 0.5 * 6
def verb(x, wet=0.35): y = fftconvolve(x, IR)[:len(x) + len(IR) - 1]; o = np.zeros(len(y)); o[:len(x)] += x * (1 - wet); return o + y * wet
def pad(x, n): return np.pad(x, (0, max(0, n - len(x))))[:n]

# ---------- sound effects ----------
def s_tick(): d = 0.05; return bp(noise(d), 2000, 6000) * env(int(d * SR), 0.001, 0.008) * 0.6
def s_select(): t = t_(0.6); return verb(np.sin(2 * np.pi * 880 * t) * env(len(t), 0.002, 0.12) * 0.4 + np.sin(2 * np.pi * 1320 * t) * env(len(t), 0.002, 0.08) * 0.25 + lp(noise(0.6), 300) * env(len(t), 0.001, 0.08) * 0.6, 0.4)
def s_whoosh():
    d = 0.7; t = t_(d); x = noise(d); f = np.linspace(300, 2500, len(t)); y = np.zeros_like(x)
    blk = 1024
    for i in range(0, len(x), blk): fc = f[i]; y[i:i + blk] = bp(x[i:i + blk + 2000], fc * 0.6, fc * 1.4)[:len(y[i:i + blk])]
    return y * np.sin(np.pi * t / d) ** 2 * 0.5
def s_sputter():
    d = 1.6; t = t_(d); out = np.zeros(len(t))
    for i, tt in enumerate(np.cumsum([0.0, 0.09, 0.1, 0.12, 0.16, 0.2, 0.26, 0.34])):
        a = int(tt * SR); b = lp(noise(0.12), 180, 4) * env(int(0.12 * SR), 0.003, 0.04) * (1 - i / 9); out[a:a + len(b)] += b
    out += lp(noise(d), 90) * np.exp(-t / 0.5) * 0.4 + np.sin(2 * np.pi * 45 * t * (1 - t / 3)) * np.exp(-t / 0.35) * 0.3
    return norm(out, 0.8)
def s_sting():
    d = 2.6; t = t_(d); x = np.zeros(len(t))
    for f in [146.8, 155.6, 220, 233.1, 587, 622]: x += np.sin(2 * np.pi * f * t + 3 * np.sin(2 * np.pi * 5.5 * t)) * (1.0 if f < 300 else 0.35)
    x *= np.minimum(1, t / 0.03) * np.exp(-t / 0.9); x += hp(noise(d), 3000) * np.exp(-t / 0.4) * 0.3
    return verb(norm(x, 0.6), 0.5)
def s_bonecrack():
    out = np.zeros(int(0.5 * SR))
    for k in range(5): a = int((0.02 + k * 0.035 + rs.rand() * 0.02) * SR); b = hp(noise(0.03), 1200) * env(int(0.03 * SR), 0.0005, 0.006); out[a:a + len(b)] += b * (1 - k * 0.12)
    return out * 0.7
def s_boom(): d = 2.4; t = t_(d); return verb(np.sin(2 * np.pi * (48 - 10 * t) * t) * np.minimum(1, t / 0.01) * np.exp(-t / 0.8) * 0.9 + lp(noise(d), 120) * np.exp(-t / 0.3) * 0.5, 0.3)
def s_card(): d = 0.35; t = t_(d); return bp(noise(d), 800, 5000) * np.exp(-t / 0.05) * 0.35 + np.sin(2 * np.pi * 180 * t) * np.exp(-t / 0.06) * 0.4
def s_pop(): d = 0.15; t = t_(d); f = 600 * np.exp(-t * 20) + 300; return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.04) * 0.4
def s_twitch(): return s_bonecrack() * 0.6
def s_hit(): d = 1.8; t = t_(d); return verb(np.sin(2 * np.pi * 55 * t) * np.exp(-t / 0.5) * 0.9 + lp(noise(d), 400) * np.exp(-t / 0.15) * 0.8 + hp(noise(d), 4000) * np.exp(-t / 0.08) * 0.3, 0.4)
def s_scream():
    d = 1.6; t = t_(d); f0 = 330 + 140 * np.sin(2 * np.pi * 1.2 * t) + 40 * np.sin(2 * np.pi * 7 * t) + 25 * rs.randn(len(t)).cumsum() / np.sqrt(len(t)) * 3
    ph = 2 * np.pi * np.cumsum(f0) / SR; src = np.sign(np.sin(ph)) * 0.5 + np.sin(ph * 2.01) * 0.3 + noise(d) * 0.5
    x = bp(src, 700, 1300) * 1.0 + bp(src, 2300, 3200) * 0.7 + bp(noise(d), 3000, 8000) * 0.4
    x = np.tanh(x * 2.5); x *= np.minimum(1, t / 0.06) * np.where(t < 1.1, 1, np.exp(-(t - 1.1) / 0.2))
    return verb(norm(x, 0.85), 0.35)
def s_impact(): return norm(s_hit() + pad(s_boom(), len(s_hit())) * 0.6, 1.0)
def s_step(): d = 0.25; t = t_(d); return lp(noise(d), 500) * env(len(t), 0.002, 0.03) * 0.8 + np.sin(2 * np.pi * 70 * t) * np.exp(-t / 0.04) * 0.4
def s_barefoot():
    d = 0.35; t = t_(d); slap = bp(noise(d), 600, 3500) * env(len(t), 0.001, 0.025); thud = lp(noise(d), 250) * env(len(t), 0.003, 0.05)
    sq = bp(noise(d), 2500, 6000) * env(len(t), 0.03, 0.06) * 0.25
    return norm(slap * 0.8 + thud + sq, 0.9)
def s_heartbeat():
    d = 7.0; out = np.zeros(int(d * SR)); bpm = 92
    for k in range(int(d * bpm / 60)):
        for off, amp in [(0, 1), (0.16, 0.7)]:
            a = int((k * 60 / bpm + off) * SR); tt = t_(0.25); b = np.sin(2 * np.pi * 52 * tt) * np.exp(-tt / 0.06) * amp; out[a:a + len(b)] += b[:len(out) - a]
    return out * np.minimum(1, np.arange(len(out)) / SR / 0.5) * np.minimum(1, (len(out) - np.arange(len(out))) / SR / 1.5) * 0.9
def s_buzz(): d = 0.35; t = t_(d); return lp(np.sign(np.sin(2 * np.pi * 110 * t)), 1500) * env(len(t), 0.005, 0.15) * 0.3
def s_grab(): return norm(s_hit()[:int(0.6 * SR)] * 0.7 + pad(bp(noise(0.3), 300, 2000) * env(int(0.3 * SR), 0.002, 0.07), int(0.6 * SR)), 0.8)
def s_xstamp(): d = 0.6; t = t_(d); return verb(np.sin(2 * np.pi * 80 * t) * np.exp(-t / 0.12) * 0.9 + bp(noise(d), 200, 2000) * np.exp(-t / 0.05) * 0.6, 0.25)
def s_lockclick():
    out = np.zeros(int(0.3 * SR))
    for off, amp in [(0, 1), (0.045, 0.6)]: a = int(off * SR); b = bp(noise(0.03), 1500, 7000) * env(int(0.03 * SR), 0.0003, 0.004) * amp; out[a:a + len(b)] += b
    out += pad(np.sin(2 * np.pi * 400 * t_(0.05)) * np.exp(-t_(0.05) / 0.01) * 0.3, len(out)); return out * 0.9
def s_swing(): x = s_whoosh(); return x[::-1][:int(0.5 * SR)] * 0.8
def s_glass():
    d = 2.0; t = t_(d); out = hp(noise(d), 2500) * np.exp(-t / 0.25) * 0.7 + lp(noise(d), 300) * np.exp(-t / 0.06) * 0.8
    for k in range(40):  # tinkling shards
        a = int((0.05 + rs.rand() ** 1.5 * 1.3) * SR); f = 3000 + rs.rand() * 5000; tt = t_(0.08); b = np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.015) * (0.15 + rs.rand() * 0.25); out[a:a + len(b)] += b
    return verb(norm(out, 1.0), 0.25)
def s_good(): t = t_(0.9); return verb((np.sin(2 * np.pi * 523 * t) * np.exp(-t / 0.2) + np.sin(2 * np.pi * 784 * np.maximum(t - 0.09, 0)) * (t > 0.09) * np.exp(-np.maximum(t - 0.09, 0) / 0.25)) * 0.3, 0.4)
def s_switch(): return s_lockclick() * 0.8
def s_cloth(): d = 0.5; t = t_(d); return bp(noise(d), 500, 3000) * np.sin(np.pi * t / d) ** 2 * 0.25
def s_slide(): d = 0.9; t = t_(d); return bp(noise(d), 200, 1800) * np.sin(np.pi * t / d) ** 1.5 * 0.35 + lp(noise(d), 120) * np.sin(np.pi * t / d) * 0.3
def s_tap():
    d = 0.4; t = t_(d); k = bp(noise(d), 1800, 5000) * env(len(t), 0.0003, 0.006) * 1.0 + np.sin(2 * np.pi * 2300 * t) * np.exp(-t / 0.02) * 0.25 + np.sin(2 * np.pi * 900 * t) * np.exp(-t / 0.04) * 0.2
    return verb(k, 0.3)
def s_breathstop(): d = 0.6; t = t_(d); return bp(noise(d), 400, 3000) * np.minimum(1, t / 0.05) * np.where(t < 0.35, 1, 0) * np.exp(-t / 0.4) * 0.35
def s_creak():
    d = 1.4; t = t_(d); f = 120 + 60 * np.sin(2 * np.pi * 0.6 * t); src = np.zeros(len(t)); ph = np.cumsum(f) / SR; idx = np.where(np.diff(np.floor(ph)) > 0)[0]; src[idx] = 1
    return verb(bp(src, 300, 3000) * np.sin(np.pi * t / d) * 3.0, 0.3)
def s_birds():
    d = 4.0; out = np.zeros(int(d * SR))
    for k in range(14):
        a = int(rs.rand() * (d - 0.4) * SR); tt = t_(0.18); f = 3000 + rs.rand() * 1800 + 1500 * np.sin(2 * np.pi * (8 + rs.rand() * 8) * tt); b = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / 0.18) * (0.08 + rs.rand() * 0.08); out[a:a + len(b)] += b
    return verb(out, 0.4)
def s_like(): t = t_(0.5); f = 500 + 700 * np.minimum(1, t / 0.1); return verb(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.12) * 0.35, 0.3)
def s_follow(): t = t_(0.8); return verb((np.sin(2 * np.pi * 659 * t) + 0.6 * np.sin(2 * np.pi * 988 * t)) * np.exp(-t / 0.18) * 0.3, 0.35)

# ---------- Part 4 (frozen lake) effects ----------
def s_wind(): d = 5.0; t = t_(d); x = bp(noise(d), 250, 1400) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.35 * t)) * np.sin(np.pi * t / d) ** 0.7; return x * 0.35
def s_snap():
    d = 0.9; t = t_(d); tw = np.sin(2 * np.pi * (900 - 500 * t) * t) * np.exp(-t / 0.15) * 0.35
    return verb(hp(noise(d), 2500) * env(len(t), 0.0005, 0.01) * 0.9 + tw + bp(noise(d), 300, 3000) * np.exp(-t / 0.06) * 0.3, 0.3)
def s_splash():
    d = 1.6; t = t_(d); out = lp(noise(d), 900) * env(len(t), 0.01, 0.25) * 0.8 + bp(noise(d), 1500, 6000) * env(len(t), 0.02, 0.18) * 0.4
    for k in range(25):
        a = int((0.05 + rs.rand() * 1.2) * SR); tt = t_(0.06); f = 600 + rs.rand() * 1400; b = np.sin(2 * np.pi * f * (1 + 3 * tt) * tt) * np.exp(-tt / 0.02) * (0.1 + rs.rand() * 0.15); out[a:a + len(b)] += b
    return verb(norm(out, 0.8), 0.3)
def s_icecrack():
    d = 1.8; t = t_(d); out = np.zeros(len(t))
    for k in range(9):
        a = int((k * 0.025 + rs.rand() * 0.04) * SR); b = hp(noise(0.04), 900) * env(int(0.04 * SR), 0.0003, 0.006) * (1 - k * 0.08); out[a:a + len(b)] += b
    # the singing "pew" of lake ice
    ping = np.sin(2 * np.pi * np.cumsum(2400 * np.exp(-t * 3.5) + 300) / SR) * np.exp(-t / 0.35) * 0.25
    out += ping + lp(noise(d), 120) * np.exp(-t / 0.2) * 0.4
    return verb(norm(out, 0.9), 0.45)
def s_crunch():
    d = 0.35; t = t_(d); out = np.zeros(len(t))
    for k in range(14): a = int((rs.rand() * 0.12) * SR); b = bp(noise(0.02), 1500, 7000) * env(int(0.02 * SR), 0.0005, 0.004) * rs.rand(); out[a:a + len(b)] += b
    return norm(out + lp(noise(d), 300) * env(len(t), 0.003, 0.05) * 0.6, 0.9)
def s_splitjaw():
    d = 1.2; t = t_(d); wet = bp(noise(d), 300, 2500) * np.exp(-t / 0.3) * (1 + 0.6 * np.sin(2 * np.pi * 23 * t)) * 0.6
    crack = pad(s_bonecrack(), len(t)) * 1.2; growl = lp(np.sign(np.sin(2 * np.pi * (70 + 20 * np.sin(2 * np.pi * 3 * t)) * t)), 500) * np.exp(-t / 0.5) * 0.35
    return verb(norm(wet + crack + growl, 0.9), 0.3)
def s_phonebuzz():
    d = 1.3; t = t_(d); g = ((t % 0.65) < 0.45).astype(float); return lp(np.sign(np.sin(2 * np.pi * 170 * t)) * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * t)), 900) * g * 0.35
def s_screech():
    d = 1.3; t = t_(d); f0 = 520 + 180 * np.sin(2 * np.pi * 2 * t) + 60 * np.sin(2 * np.pi * 11 * t); ph = 2 * np.pi * np.cumsum(f0) / SR
    x = np.tanh((bp(np.sign(np.sin(ph)) + noise(d) * 0.6, 900, 3800)) * 3) * np.minimum(1, t / 0.04) * np.exp(-t / 0.6)
    return verb(norm(x, 0.8), 0.4)
def s_click(): return s_lockclick() * 0.9
def s_clink():
    d = 1.4; t = t_(d); x = sum(np.sin(2 * np.pi * f * t) * np.exp(-t / dd) for f, dd in [(2900, 0.25), (4300, 0.15), (6100, 0.08)]) * 0.3
    return verb(x + hp(noise(d), 4000) * env(len(t), 0.0003, 0.01) * 0.6, 0.5)
def s_drip(): d = 0.6; t = t_(d); return verb(np.sin(2 * np.pi * np.cumsum(900 + 1400 * np.minimum(1, t / 0.05)) / SR) * np.exp(-t / 0.05) * 0.5, 0.4)
#

# ---------- Part 5 (desert gas station) effects ----------
def _wav(p):
    sr, x = wavfile.read(p); x = x.astype(np.float64) / 32768
    return np.interp(np.arange(int(len(x) * SR / sr)) / SR, np.arange(len(x)) / sr, x)
def _mimic(k, rate=0.96):   # the mimicked mother: slowed a touch, doubled with a detuned copy, low growl underneath, cave reverb
    x = _wav(f'data/mimic_{k}.wav'); n = int(len(x) / rate); a = np.interp(np.arange(n) * rate, np.arange(len(x)), x)
    b = np.interp(np.arange(int(n * 1.02)) * rate * 0.98, np.arange(len(x)), x)[:n]; b = pad(b, n)
    c = np.interp(np.arange(n) * rate * 0.5, np.arange(len(x)), x); c = lp(c, 600)
    t = np.arange(n) / SR; trem = 1 + 0.25 * np.sin(2 * np.pi * 5.5 * t)
    y = (a * 0.8 + b * 0.45 + c * 0.35) * trem; y = bp(y, 180, 6000)
    return verb(norm(np.concatenate([y, np.zeros(int(0.8 * SR))]), 0.9), 0.45)
def s_mimic1(): return _mimic(1)
def s_mimic2(): return _mimic(2, 0.99)
def s_mimic3(): return _mimic(3)
def s_mimicS(): x = _mimic(1); return x[:int(1.4 * SR)] * np.minimum(1, np.linspace(6, 0, int(1.4 * SR)))
def s_hum(): d = 6.0; t = t_(d); return (np.sin(2 * np.pi * 120 * t) * 0.5 + np.sin(2 * np.pi * 240 * t) * 0.2 + bp(noise(d), 2000, 6000) * 0.05) * np.sin(np.pi * t / d) ** 0.4 * 0.25
def s_pumpflow(): d = 3.0; t = t_(d); return (bp(noise(d), 400, 2500) * 0.4 + lp(noise(d), 200) * 0.3) * np.sin(np.pi * t / d) ** 0.5 * 0.35
def s_nozzle(): d = 0.5; t = t_(d); return verb(lp(noise(d), 1500) * np.exp(-t / 0.03) * 0.7 + np.sin(2 * np.pi * 320 * t) * np.exp(-t / 0.08) * 0.4, 0.2)
def s_jawdrop():   # wet stretch + joints cracking
    d = 1.3; t = t_(d); wet = bp(noise(d), 200, 1800) * np.exp(-t / 0.4) * (1 + 0.7 * np.sin(2 * np.pi * 17 * t)) * 0.6
    groan = lp(np.sign(np.sin(2 * np.pi * np.cumsum(90 - 40 * t) / SR)), 450) * np.exp(-t / 0.6) * 0.35
    return verb(norm(wet + pad(s_bonecrack(), len(t)) * 1.1 + groan, 0.9), 0.3)
def s_doorhandle(): d = 0.4; t = t_(d); return bp(noise(d), 1500, 6000) * np.exp(-t / 0.02) * 0.6 + np.sin(2 * np.pi * 900 * t) * np.exp(-t / 0.05) * 0.2
def s_doorrip():   # metal tearing + hinge snap
    d = 1.4; t = t_(d); f = 300 + 900 * np.abs(np.sin(2 * np.pi * 3 * t)); scr = np.tanh(bp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) + noise(d) * 0.5, 500, 4000) * 2) * np.exp(-t / 0.45) * 0.5
    return verb(norm(scr + pad(s_hit(), len(t)) * 0.8 + hp(noise(d), 3000) * np.exp(-t / 0.05) * 0.5, 0.95), 0.3)
def s_shout(): d = 0.8; t = t_(d); return verb(bp(noise(d), 300, 1400) * np.sin(np.pi * np.clip(t / 0.6, 0, 1)) * 0.35 + np.sin(2 * np.pi * np.cumsum(220 + 30 * np.sin(2 * np.pi * 3 * t)) / SR) * np.sin(np.pi * np.clip(t / 0.6, 0, 1)) * 0.15, 0.5)
def s_doorbell(): t = t_(1.2); return verb((np.sin(2 * np.pi * 1318 * t) * np.exp(-t / 0.3) + np.sin(2 * np.pi * 1046 * np.maximum(t - 0.25, 0)) * (t > 0.25) * np.exp(-np.maximum(t - 0.25, 0) / 0.35)) * 0.25, 0.4)
def s_squeak(): d = 0.7; t = t_(d); f = 900 + 700 * np.sin(np.pi * t / d); return verb(np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.6 + 0.4 * np.sin(2 * np.pi * 37 * t)) * np.sin(np.pi * t / d) * 0.3 + bp(noise(d), 1000, 3000) * np.sin(np.pi * t / d) * 0.12, 0.3)
def s_glassthud(): d = 0.9; t = t_(d); return verb(lp(noise(d), 300) * np.exp(-t / 0.06) * 0.8 + np.sin(2 * np.pi * 95 * t) * np.exp(-t / 0.15) * 0.6 + bp(noise(d), 2500, 7000) * np.exp(-t / 0.2) * 0.12 * (1 + np.sin(2 * np.pi * 60 * t)), 0.3)
def s_breath(): d = 2.4; t = t_(d); e = np.sin(np.pi * np.clip(t / 1.0, 0, 1)) * (t < 1.0) + np.sin(np.pi * np.clip((t - 1.2) / 1.1, 0, 1)) * (t > 1.2) * 0.8; return verb(bp(noise(d), 250, 1600) * e * 0.4 + lp(noise(d), 120) * e * 0.3, 0.4)
FX = {k[2:]: v for k, v in globals().items() if k.startswith('s_')}

# ---------- music: creepy ambient bed (D minor), warmer at dawn ----------
def music():
    t = np.arange(N) / SR; out = np.zeros(N)
    dawnA, dawnB = [l for l in T['lines'] if l['id'] == 'dawn'][0]['start'] - 0.6, [l for l in T['lines'] if l['id'] == 'dawn'][0]['start'] + 2
    dk = np.clip((t - dawnA) / (dawnB - dawnA), 0, 1); endk = np.clip((t - (DUR - 1.2)) / 0.6, 0, 1); dk = dk * (1 - endk)
    # drone
    lfo = 0.6 + 0.4 * np.sin(2 * np.pi * 0.07 * t)
    drone = np.sin(2 * np.pi * 73.42 * t) * 0.5 + np.sin(2 * np.pi * 73.9 * t) * 0.4 + np.sin(2 * np.pi * 110.0 * t + np.sin(2 * np.pi * 0.1 * t)) * 0.25 * (1 - dk)
    drone += np.sin(2 * np.pi * 77.78 * t) * 0.18 * (1 - dk)   # dissonant minor second
    out += lp(drone, 400) * lfo * 0.5
    # slow pads: chord changes every 6.5 s
    chords = [[146.8, 174.6, 220.0], [116.5, 146.8, 174.6], [98.0, 116.5, 146.8], [110.0, 138.6, 164.8]]
    major = [146.8, 185.0, 220.0]
    pad_ = np.zeros(N); seg = 6.5
    for i in range(int(DUR / seg) + 1):
        a = int(i * seg * SR); n = int((seg + 2) * SR); tt = np.arange(n) / SR; ch = chords[i % 4]; x = np.zeros(n)
        for f in ch:
            for det in (-0.6, 0.6): x += np.sin(2 * np.pi * (f + det) * tt) + 0.3 * np.sin(2 * np.pi * 2 * (f + det) * tt)
        x *= np.sin(np.pi * np.clip(tt / (seg + 2), 0, 1)) ** 1.2; pad_[a:a + n] += x[:N - a]
    nmaj = np.zeros(N)
    for f in major:
        for det in (-0.5, 0.5): nmaj += np.sin(2 * np.pi * (f + det) * t) + 0.3 * np.sin(2 * np.pi * 2 * (f + det) * t)
    out += lp(pad_ * (1 - dk) + nmaj * dk * 0.9, 1100) * 0.07
    # wind
    w = bp(rs.randn(N), 200, 900) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.09 * t + 1)) * 0.10
    out += w * (1 - 0.5 * dk)
    # music-box bell notes, sparse, eerie
    notes = [587.3, 698.5, 880.0, 932.3, 1174.7, 1046.5, 698.5, 622.3]; tt = t_(3.0)
    bell = lambda f: (np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt / 0.3)) * np.exp(-tt / 0.9)
    bells = np.zeros(N + len(tt)); k = 0; tb = 3.2
    while tb < DUR - 1:
        f = notes[k % len(notes)] * (1.0 if dk[int(tb * SR)] < 0.5 else 1.0); bells[int(tb * SR):int(tb * SR) + len(tt)] += bell(f) * (0.6 + 0.4 * rs.rand())
        tb += 1.9 + rs.rand() * 1.6; k += 1 + int(rs.rand() * 2)
    out += verb(bells[:N], 0.55)[:N] * 0.05
    for tg in np.arange(4.0, DUR - 2, 7.3):   # deep distant groans in the desert night
        a = int(tg * SR); tt = t_(2.5); g = np.sin(2 * np.pi * np.cumsum(260 * np.exp(-tt * 1.2) + 60) / SR) * np.sin(np.pi * tt / 2.5) ** 2 * 0.06
        out[a:a + len(g)] += g[:max(0, N - a)] * (1 - dk[min(a, N - 1)])
    # --- tension layer: stalking low pulse + tremolo strings + risers into every scare cue ---
    night = 1 - dk
    pulse = np.zeros(N); per = 60 / 76
    for k in range(int(DUR / per)):
        a = int(k * per * SR); tt = t_(0.5); b = np.sin(2 * np.pi * 46 * tt) * np.exp(-tt / 0.12) * (1.0 if k % 2 == 0 else 0.55); pulse[a:a + len(b)] += b[:N - a]
    out += lp(pulse, 200) * 0.45 * night
    trem = np.zeros(N)
    for f in (293.7, 311.1, 440.0):   # dissonant cluster, slow tremolo
        trem += lp(2 * ((f * t) % 1) - 1, 1800) * (0.6 + 0.4 * np.sin(2 * np.pi * 6.5 * t))
    swell = 0.5 + 0.5 * np.sin(2 * np.pi * t / 11.0 - 1.2)
    out += trem * 0.05 * swell * night
    for c in CUES:   # 1.5 s riser into stings / scary hits
        if c['n'] in ('sting', 'scream', 'hit', 'splitjaw', 'impact'):
            b = int(c['t'] * SR); a = max(0, b - int(1.5 * SR)); n = b - a; tt = np.arange(n) / SR
            if n > 0: out[a:b] += bp(rs.randn(n), 400, 3000) * (tt / 1.5) ** 2.5 * 0.35 + np.sin(2 * np.pi * np.cumsum(180 + 500 * (tt / 1.5) ** 2) / SR) * (tt / 1.5) ** 3 * 0.12
    return out

voice_sr, v = wavfile.read('data/narration.wav'); v = v.astype(np.float64) / 32768
vi = np.interp(np.arange(int(len(v) * SR / voice_sr)) / SR, np.arange(len(v)) / voice_sr, v); voice = pad(vi, N)
mus = music()
# duck music under voice
ve = np.abs(voice); ve = np.convolve(ve, np.ones(int(0.2 * SR)) / (0.2 * SR), 'same'); duck = 1 - 0.3 * np.clip(ve / 0.08, 0, 1)
fx = np.zeros(N + 10 * SR)
VOL = {'mimic1': 1.5, 'mimic2': 1.5, 'mimic3': 1.15, 'mimicS': 1.2, 'hum': 0.6, 'pumpflow': 0.7, 'nozzle': 1.0, 'jawdrop': 0.8, 'doorhandle': 0.9, 'doorrip': 0.7, 'shout': 0.8, 'doorbell': 0.8, 'squeak': 0.9, 'glassthud': 0.9, 'breath': 1.0, 'wind': 1.0, 'snap': 0.9, 'splash': 0.8, 'icecrack': 0.8, 'crunch': 1.1, 'splitjaw': 0.7, 'phonebuzz': 1.2, 'screech': 0.35, 'click': 1.0, 'clink': 1.0, 'drip': 1.2, 'tick': 0.6, 'whoosh': 1.1, 'scream': 0.3, 'glass': 0.6, 'impact': 0.3, 'hit': 0.32, 'sputter': 0.28, 'heartbeat': 1.1, 'barefoot': 0.85, 'tap': 1.2, 'sting': 0.6, 'boom': 0.4, 'step': 1.2, 'birds': 1.3, 'creak': 4.0, 'twitch': 1.2, 'lockclick': 1.1, 'switch': 1.1, 'cloth': 1.0, 'slide': 1.0, 'swing': 1.0, 'xstamp': 0.4, 'grab': 0.5, 'breathstop': 0.9, 'bonecrack': 0.8}
for c in CUES:
    s = FX[c['n']](); a = int(c['t'] * SR); fx[a:a + len(s)] += s * c['v'] * VOL.get(c['n'], 0.5)
fx = fx[:N]
# extra heartbeat bed through the tense hiding part
mix = voice * 1.0 + mus * duck * 0.2 + fx * 0.8   # music clearly audible (owner: Part 3 music was too quiet)
mix = np.stack([mix, mix], 1)
mix[:, 0] += np.roll(fx, 200) * 0.05; mix /= np.abs(mix).max() / 0.95
wavfile.write('data/mix_raw.wav', SR, (mix[:int(DUR * SR)] * 32767).astype(np.int16))
print('ok', DUR)
