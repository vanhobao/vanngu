// script.js - Beat Creator Pro V9

// --- DOM Elements (Giữ nguyên như V8) ---
const recordBtn = document.getElementById('recordBtnEl');
const recordIcon = document.getElementById('recordIconEl');
const recordBtnText = document.getElementById('recordBtnTextEl');
const audioFileEl = document.getElementById('audioFileEl');
const fileNameEl = document.getElementById('fileNameEl');
const vocalPlayerEl = document.getElementById('vocalPlayerEl');
const genreSelect = document.getElementById('genreSelectEl');
const tempoInput = document.getElementById('tempoInputEl');
const generatePlayBtn = document.getElementById('generatePlayBtnEl');
const regenerateBtn = document.getElementById('regenerateBtnEl');
const stopBtn = document.getElementById('stopBtnEl');
const statusPanel = document.getElementById('statusPanelEl');
const vocalVolumeSlider = document.getElementById('vocalVolumeEl');
const beatVolumeSlider = document.getElementById('beatVolumeEl');
const downloadSection = document.getElementById('downloadSectionEl');
const downloadBtn = document.getElementById('downloadBtnEl');
const downloadBtnText = document.getElementById('downloadBtnTextEl');
const addDropCheckbox = document.getElementById('addDropCheckbox');

// --- App State & Tone.js Objects (Giữ nguyên như V8) ---
let mediaRec;
let audioChunks = [];
let isRec = false;
let vocalAudioBuffer; // AudioBuffer for the user's vocal input
let beatElements = {
    scheduledParts: [], // Store all active Tone.Part or Tone.Pattern instances for the beat
    synths: {},
    masterGain: null,
    vocalGain: null,
    vocalPlayers: [], // To handle multiple instances of vocal playback
};
let outputRecorder;
let outputChunks = [];
let isPlayingGeneratedBeat = false;
let currentBeatVariationSeed = 0;

const MAX_REC_S = 90;
const MAX_FILE_MB = 15;

// --- Utility Functions (Giữ nguyên như V8) ---
function updateStatus(message, type = 'info') {
    statusPanel.textContent = message;
    statusPanel.className = 'status-panel';
    const spinnerIcon = `<span class="spinner mr-2"></span>`;
    if (type === 'processing') {
        statusPanel.innerHTML = `${spinnerIcon} ${message}`;
        statusPanel.classList.add('processing');
    } else if (type === 'success') statusPanel.classList.add('success');
    else if (type === 'error') statusPanel.classList.add('error');
    else statusPanel.classList.add('info');
}
function showAlert(message) { alert(message); }
async function initAudioContext() {
    if (Tone.context.state !== 'running') {
        try {
            await Tone.start();
            console.log("AudioContext started.");
        } catch (e) {
            console.error("Error starting AudioContext:", e);
            updateStatus("Lỗi khởi tạo âm thanh. Vui lòng tương tác với trang và thử lại.", "error");
        }
    }
}
function resetAppForNewInput(keepVocal = false) {
    stopAllAudioAndRecording();
    if (!keepVocal) {
        vocalAudioBuffer = null;
        vocalPlayerEl.src = '';
        vocalPlayerEl.classList.add('hidden');
        fileNameEl.textContent = '';
        generatePlayBtn.disabled = true;
    }
    regenerateBtn.classList.add('hidden');
    downloadBtn.disabled = true;
    downloadBtnText.textContent = "Chuẩn Bị Tải File (WAV)";
    downloadSection.classList.add('hidden');
    updateStatus(vocalAudioBuffer ? "Sẵn sàng tạo beat mới." : "Vui lòng thu âm hoặc tải file giọng hát.");
}

// --- Recording & File Upload (Giữ nguyên như V8) ---
recordBtn.addEventListener('click', async () => {
    await initAudioContext();
    if (!isRec) {
        resetAppForNewInput(false);
        updateStatus("Đang yêu cầu quyền micro...", "processing");
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRec = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
            audioChunks = [];
            mediaRec.ondataavailable = event => audioChunks.push(event.data);
            mediaRec.onstop = async () => {
                isRec = false;
                stream.getTracks().forEach(track => track.stop());
                recordIcon.classList.remove('fa-beat', 'text-red-500');
                recordBtnText.textContent = "Thu Âm Giọng Hát";
                if (audioChunks.length === 0) {
                    updateStatus("Không có dữ liệu âm thanh được ghi.", "error"); return;
                }
                updateStatus("Đang xử lý bản thu...", "processing");
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                vocalPlayerEl.src = URL.createObjectURL(audioBlob);
                vocalPlayerEl.classList.remove('hidden');
                const arrayBuffer = await audioBlob.arrayBuffer();
                vocalAudioBuffer = await Tone.context.decodeAudioData(arrayBuffer);
                generatePlayBtn.disabled = false;
                updateStatus(`Đã thu âm ${vocalAudioBuffer.duration.toFixed(1)}s. Sẵn sàng tạo beat.`, "success");
            };
            mediaRec.start();
            isRec = true;
            updateStatus("Đang thu âm... (Tối đa 90 giây)", "processing");
            recordIcon.classList.add('fa-beat', 'text-red-500');
            recordBtnText.textContent = "Dừng Thu Âm";
            setTimeout(() => {
                if (isRec && mediaRec && mediaRec.state === "recording") { mediaRec.stop(); showAlert("Đã tự động dừng ghi âm sau 90 giây.");}
            }, MAX_REC_S * 1000);
        } catch (err) { updateStatus("Lỗi: Không thể truy cập micro.", "error"); isRec = false; }
    } else {
        if (mediaRec && mediaRec.state === "recording") mediaRec.stop();
    }
});
audioFileEl.addEventListener('change', async (event) => {
    await initAudioContext();
    const file = event.target.files[0];
    if (!file) return;
    resetAppForNewInput(false);
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
        showAlert(`File quá lớn (Tối đa ${MAX_FILE_MB}MB).`);
        audioFileEl.value = ''; return;
    }
    fileNameEl.textContent = `Đang tải: ${file.name}`;
    updateStatus("Đang xử lý file tải lên...", "processing");
    try {
        const arrayBuffer = await file.arrayBuffer();
        vocalAudioBuffer = await Tone.context.decodeAudioData(arrayBuffer);
        vocalPlayerEl.src = URL.createObjectURL(file);
        vocalPlayerEl.classList.remove('hidden');
        fileNameEl.textContent = `File: ${file.name} (${vocalAudioBuffer.duration.toFixed(1)}s)`;
        generatePlayBtn.disabled = false;
        updateStatus("File đã tải. Nhấn 'Tạo Beat & Phát'.", "success");
    } catch (err) { updateStatus("Lỗi: Không thể xử lý file.", "error"); fileNameEl.textContent = ""; vocalAudioBuffer = null;}
});


// --- Beat Generation and Playback ---
function stopAllAudioAndRecording(preserveOutputRecorder = false) {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    
    beatElements.vocalPlayers.forEach(player => {
        if (player) player.stop(0).dispose();
    });
    beatElements.vocalPlayers = [];
    
    beatElements.scheduledParts.forEach(part => {
        if (part) part.stop(0).dispose();
    });
    beatElements.scheduledParts = [];
    
    Object.values(beatElements.synths).forEach(synth => {
        if (synth && typeof synth.dispose === 'function') {
            if(typeof synth.triggerRelease === 'function') synth.triggerRelease();
            synth.dispose();
        }
    });
    beatElements.synths = {};
    
    if (beatElements.masterGain) { beatElements.masterGain.dispose(); beatElements.masterGain = null; }
    if (beatElements.vocalGain) { beatElements.vocalGain.dispose(); beatElements.vocalGain = null; }
    
    if (!preserveOutputRecorder && outputRecorder && outputRecorder.state === "recording") {
        outputRecorder.stop();
    }
    
    stopBtn.disabled = true;
    if (vocalAudioBuffer) generatePlayBtn.disabled = false;
    regenerateBtn.classList.toggle('hidden', !vocalAudioBuffer || !isPlayingGeneratedBeat);
    isPlayingGeneratedBeat = false;
}

function defineAndConnectSynths() { // Tương tự V8, đảm bảo tất cả synth cần thiết được định nghĩa
    if (beatElements.masterGain) beatElements.masterGain.dispose();
    beatElements.masterGain = new Tone.Gain(parseFloat(beatVolumeSlider.value)).toDestination();
    
    if (beatElements.vocalGain) beatElements.vocalGain.dispose();
    beatElements.vocalGain = new Tone.Gain(parseFloat(vocalVolumeSlider.value)).toDestination();

    Object.values(beatElements.synths).forEach(synth => {
        if (synth && typeof synth.dispose === 'function') synth.dispose();
    });
    // Copy toàn bộ định nghĩa synths từ V8 vào đây, bao gồm cả các synth cho Bolero, V-Pop, EDM, etc.
    // Ví dụ:
    beatElements.synths = {
        kick: new Tone.MembraneSynth({ pitchDecay: 0.03, octaves: 6, envelope: { attack: 0.001, decay: 0.28 } }).connect(beatElements.masterGain),
        snare: new Tone.NoiseSynth({ noise: { type: 'white', playbackRate: 1.3 }, envelope: { attack: 0.001, decay: 0.14 } }).connect(beatElements.masterGain),
        hihat_closed: new Tone.MetalSynth({ frequency: 320, envelope: { attack: 0.001, decay: 0.04, release: 0.01 }, harmonicity: 4.8, modulationIndex: 20, resonance: 3000 }).connect(beatElements.masterGain),
        bass: new Tone.MonoSynth({ oscillator: { type: "fmsquare" }, envelope: { attack: 0.01, decay: 0.25 } }).connect(beatElements.masterGain),
        piano: new Tone.Sampler({ urls: { C4: "https://tonejs.github.io/audio/casio/C4.mp3", A3: "https://tonejs.github.io/audio/casio/A3.mp3" }, release: 1,baseUrl: ""}).connect(beatElements.masterGain),
        pad: new Tone.PolySynth(Tone.FMSynth, { envelope: { attack: 1.5, release: 2.5 } }).connect(beatElements.masterGain),
        // Bolero Synths
        kick_bolero: new Tone.MembraneSynth({ pitchDecay: 0.06, octaves: 3, envelope: { attack: 0.005, decay: 0.4 } }).connect(beatElements.masterGain),
        snare_brush_bolero: new Tone.NoiseSynth({ noise: { type: 'pink', playbackRate: 0.8 }, envelope: { attack: 0.005, decay: 0.1} }).connect(beatElements.masterGain),
        shaker_bolero: new Tone.MetalSynth({ frequency: 700, envelope: { attack: 0.02, decay: 0.04 }, harmonicity: 8}).connect(beatElements.masterGain),
        bass_bolero: new Tone.MonoSynth({ oscillator: { type: "sine" }, filter: {type: "lowpass", Q: 1, frequency: 300}, envelope: { attack: 0.02, decay: 0.7 }}).connect(beatElements.masterGain),
        guitar_nylon: new Tone.PluckSynth({ attackNoise: 0.1, dampening: 3500, release: 0.8 }).connect(beatElements.masterGain),
        guitar_nylon_chord: new Tone.PolySynth(Tone.PluckSynth, { attackNoise: 0.05, dampening: 3000, volume: -10 }).connect(beatElements.masterGain),
        accordion_bolero: new Tone.PolySynth(Tone.Synth, { oscillator: {type: "pwm", modulationFrequency: 0.5}, envelope: { attack: 0.1, decay: 1.5}, volume: -15 }).connect(beatElements.masterGain),
        strings_bolero: new Tone.PolySynth(Tone.Synth, { oscillator: {type: "fatsawtooth", count: 6}, envelope: { attack: 1.8, decay: 2}, volume: -20 }).connect(beatElements.masterGain),
        lead_guitar_bolero: new Tone.Synth({ oscillator: {type: "triangle"}, envelope: {attack: 0.01, decay: 0.5}, filter: {Q: 2, frequency: 1500}, portamento: 0.02 }).connect(beatElements.masterGain),
        // Add other synths from V8 (ST, Jack, EDM etc.)
         // ... (Thêm đầy đủ các synths từ V8 ở đây)
    };
     // Adjust initial volumes (Copy từ V8 và tinh chỉnh)
    const initialVolumes = { kick: -3, snare: -9, hihat_closed: -24, bass: -12, piano: -8, pad: -26, kick_bolero: -8, snare_brush_bolero: -18, shaker_bolero: -28, bass_bolero: -12, guitar_nylon: -14, guitar_nylon_chord: -16, accordion_bolero: -18, strings_bolero: -22, lead_guitar_bolero: -10, /* ... more ... */};
    for (const synthName in initialVolumes) {
        if (beatElements.synths[synthName] && beatElements.synths[synthName].volume) {
            beatElements.synths[synthName].volume.value = initialVolumes[synthName];
        }
    }
}


async function playGeneratedBeat() {
    if (!vocalAudioBuffer) { showAlert("Vui lòng cung cấp giọng hát!"); return; }
    await initAudioContext();
    stopAllAudioAndRecording(true); 

    updateStatus("Đang tạo cấu trúc bài hát...", "processing");
    generatePlayBtn.disabled = true;
    regenerateBtn.disabled = true;
    stopBtn.disabled = false;

    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 300)); // UI update delay

    defineAndConnectSynths();

    const genre = genreSelect.value;
    const tempo = parseInt(tempoInput.value);
    Tone.Transport.bpm.value = tempo;
    const userVocalDuration = vocalAudioBuffer.duration;
    const includeSpecialSection = addDropCheckbox.checked;

    // Get the full song structure: { sections: Array, totalDuration: Number }
    const songData = getFullSongStructure(genre, tempo, userVocalDuration, currentBeatVariationSeed, includeSpecialSection);
    beatElements.scheduledParts = [];
    beatElements.vocalPlayers = []; // Reset vocal players

    let accumulatedTime = 0;

    songData.sections.forEach(section => {
        if (section.events && section.events.length > 0) {
            const part = new Tone.Part((time, value) => {
                const synth = beatElements.synths[value.instrument];
                if (synth) {
                    // Handle special synth behaviors if needed (e.g., 808 glide)
                    if (value.instrument === 'bass_808' && value.glide && synth.frequency) {
                         synth.triggerAttack(value.note, time);
                         synth.frequency.linearRampTo(Tone.Frequency(value.note).transpose(value.glide).toFrequency(), time + Tone.Time(value.duration).toSeconds() * 0.8);
                         synth.triggerRelease(time + Tone.Time(value.duration).toSeconds());
                    } else {
                        synth.triggerAttackRelease(value.note, value.duration || "8n", time, value.velocity || 0.8);
                    }
                }
            }, section.events).start(section.startTime); // Start section at its designated absolute time
            beatElements.scheduledParts.push(part);
        }

        // Schedule vocal if it's a vocal section
        if (section.isVocalSection && vocalAudioBuffer) {
            const vocalPlayerInstance = new Tone.Player(vocalAudioBuffer).connect(beatElements.vocalGain);
            vocalPlayerInstance.start(section.startTime); // Start vocal at the beginning of this section
            beatElements.vocalPlayers.push(vocalPlayerInstance);

            // If vocal is shorter than section, schedule it again or let it be silent
            // For now, it plays once per designated vocal section.
            // If section.duration > userVocalDuration, there will be instrumental part in that section after vocal.
        }
        accumulatedTime = section.startTime + section.duration; // Keep track of total length
    });
    
    // Transport settings
    Tone.Transport.loop = false; // Song plays once through
    // Schedule transport stop after the full song duration
    Tone.Transport.scheduleOnce((time) => {
        if (isPlayingGeneratedBeat) {
            stopAllAudioAndRecording(false);
            updateStatus("Bài hát hoàn tất. Sẵn sàng tải về.", "success");
        }
    }, songData.totalDuration + 0.5); // Add a small buffer for safety

    // Prepare to record the output for download
    if (outputRecorder && outputRecorder.state === "recording") outputRecorder.stop();
    const dest = Tone.context.createMediaStreamDestination();
    Tone.getDestination().connect(dest);
    outputRecorder = new MediaRecorder(dest.stream, { mimeType: 'audio/webm;codecs=opus' });
    outputChunks = [];
    outputRecorder.ondataavailable = e => { if (e.data.size > 0) outputChunks.push(e.data); };
    outputRecorder.onstop = () => {
        Tone.getDestination().disconnect(dest);
        dest.stream.getTracks().forEach(track => track.stop());
        if (outputChunks.length > 0) {
            downloadBtn.disabled = false;
            downloadBtnText.textContent = "Tải File Beat (WAV)";
        } else {
            downloadBtn.disabled = true;
            downloadBtnText.textContent = "Chuẩn Bị Tải File (WAV)";
        }
         if(!isPlayingGeneratedBeat && outputChunks.length > 0){ // If stopped manually before transport auto-stop
            updateStatus("Đã dừng. Sẵn sàng tải về.", "success");
        }
    };

    await Tone.Transport.start("+0.2"); // Start with a slight delay
    outputRecorder.start();
    isPlayingGeneratedBeat = true;

    updateStatus(`Đang phát bài hát (${genreSelect.options[genreSelect.selectedIndex].text}, ~${(songData.totalDuration/60).toFixed(1)} phút)...`, "success");
    regenerateBtn.classList.remove('hidden');
    regenerateBtn.disabled = false;
    downloadSection.classList.remove('hidden');
    downloadBtn.disabled = true;
    downloadBtnText.textContent = "Dừng phát để chuẩn bị file";
}

// --- Event Listeners (Tương tự V8, đảm bảo các nút gọi hàm đúng) ---
generatePlayBtn.addEventListener('click', () => {
    currentBeatVariationSeed = 0;
    playGeneratedBeat();
});
regenerateBtn.addEventListener('click', () => {
    currentBeatVariationSeed++;
    playGeneratedBeat();
});
stopBtn.addEventListener('click', () => {
    stopAllAudioAndRecording(false); // Stop recording and prepare download
    updateStatus("Đã dừng phát.", "info");
});

vocalVolumeSlider.addEventListener('input', (e) => {
    if (beatElements.vocalGain) beatElements.vocalGain.gain.linearRampTo(parseFloat(e.target.value), 0.05);
});
beatVolumeSlider.addEventListener('input', (e) => {
    if (beatElements.masterGain) beatElements.masterGain.gain.linearRampTo(parseFloat(e.target.value), 0.05);
});
downloadBtn.addEventListener('click', () => {
    if (outputChunks.length > 0) {
        const finalBlob = new Blob(outputChunks, { type: 'audio/wav' });
        const downloadUrl = URL.createObjectURL(finalBlob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `full_song_mix_${genreSelect.value}_${tempoInput.value}bpm_var${currentBeatVariationSeed}.wav`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
        updateStatus("File đã được tải về!", "success");
        downloadBtn.disabled = true;
        downloadBtnText.textContent = "Đã Tải Về";
        outputChunks = [];
    } else {
        showAlert("Chưa có dữ liệu để tải. Hãy dừng phát để chuẩn bị file, sau đó nhấn tải.");
    }
});

// --- Initial Setup ---
resetAppForNewInput();