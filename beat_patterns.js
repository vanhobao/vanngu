// beat_patterns.js

function getFullSongStructure(genre, tempo, vocalDuration, variationSeed = 0, includeSpecialSection = false) {
    const songStructure = []; // Array of section objects: { name, duration, events, isVocalSection }
    const beatsPerMeasure = 4;
    const quarterNoteTime = Tone.Time("4n").toSeconds(); // Duration of a quarter note at current tempo
    const measureTime = quarterNoteTime * beatsPerMeasure;

    // --- DEFAULT SECTION DURATIONS (can be overridden by genre) ---
    // These are TARGET durations. The actual pattern events will define the real length of a section loop.
    const DURATION_INTRO = measureTime * 4;       // 4 bars
    const DURATION_VERSE = vocalDuration > 0 ? Math.max(measureTime * 8, vocalDuration) : measureTime * 8; // At least 8 bars or vocal length
    const DURATION_CHORUS = measureTime * 8;      // 8 bars
    const DURATION_INSTRUMENTAL = measureTime * 4; // 4 bars
    const DURATION_BRIDGE_DROP = measureTime * 8; // 8 bars
    const DURATION_CLIMAX = measureTime * 8;      // 8 bars
    const DURATION_OUTRO = measureTime * 4;       // 4 bars

    let currentSectionStartTime = 0;

    // Helper to add section
    function addSection(name, duration, events, isVocal = false) {
        songStructure.push({
            name: name,
            startTime: currentSectionStartTime, // Absolute start time in the transport
            duration: duration,                 // Duration of this section's loop or one-shot play
            events: events,                     // Tone.js part events for this section
            isVocalSection: isVocal,
            variation: variationSeed // Pass variation seed for potential use in pattern generation
        });
        currentSectionStartTime += duration; // Increment for next section
    }
    
    // --- DEFINE PATTERNS FOR EACH SECTION OF EACH GENRE ---
    // This requires significant musical input. Below are very basic placeholders.
    // You need to create detailed Tone.js event arrays for `patterns.intro`, `patterns.verse`, etc. for each genre.

    let patterns = {
        intro: [], verse: [], chorus: [], instrumental: [], bridgeDrop: [], climax: [], outro: []
    };

    // Example for one genre structure, extend for all genres
    if (genre === 'pop_ballad') {
        // Intro patterns
        patterns.intro = [
            { time: "0:0", instrument: 'piano', note: ["C3", "E3", "G3"], duration: "1m", velocity: 0.5 },
            { time: "1:0", instrument: 'pad', note: ["F2", "A2", "C3"], duration: "1m", velocity: 0.4 },
            { time: "2:0", instrument: 'strings_bolero', note: ["G3", "B3", "D4"], duration: "2m", velocity: 0.3}
        ];
        // Verse patterns (should be relatively sparse to let vocals shine)
        patterns.verse = [
            { time: "0:0", instrument: 'kick', note: 'C1', velocity: 0.7 }, { time: "0:2", instrument: 'snare', note: 'C2', velocity: 0.6 },
            { time: "0:0", instrument: 'piano', note: ["Am2","C3","E3"], duration: "1m"},
            { time: "1:0", instrument: 'bass', note: "A1", duration: "1m"},
            ...Array(8).fill(null).map((_, i) => ({ time: `0:${Math.floor(i/2)}:${(i%2)*2}`, instrument: 'hihat_closed', note: 'C5', duration: "16n", velocity: 0.3 })),
        ];
        // Chorus patterns (more energy)
        patterns.chorus = [
            { time: "0:0", instrument: 'kick', note: 'C1', velocity: 0.9 }, { time: "0:2", instrument: 'snare', note: 'D2', velocity: 0.8 },
            { time: "0:0", instrument: 'piano', note: ["F2","A2","C3"], duration: "1m"}, { time: "1:0", instrument: 'pad', note: ["F2","A2","C3"], duration: "1m"},
            { time: "1:0", instrument: 'bass', note: "F1", duration: "1m"},
            // ... more hihats, potentially strings ...
        ];
        patterns.instrumental = [ /* ... instrumental break patterns ... */ ];
        patterns.bridgeDrop = [ /* ... bridge/build-up patterns ... */ ];
        patterns.climax = [ /* ... climax chorus patterns, more layers, intensity ... */ ];
        patterns.outro = [ /* ... outro patterns, fading out or a final chord ... */ ];

        // Build the song structure
        addSection("Intro", DURATION_INTRO, patterns.intro);
        addSection("Verse 1", DURATION_VERSE, patterns.verse, true); // Vocal section
        addSection("Chorus 1", DURATION_CHORUS, patterns.chorus, true); // Vocal section (or lead instrument if vocal is verse only)
        addSection("Instrumental", DURATION_INSTRUMENTAL, patterns.instrumental.length > 0 ? patterns.instrumental : patterns.verse); // Reuse verse if no specific instrumental
        addSection("Verse 2", DURATION_VERSE, patterns.verse, true); // Vocal section
        addSection("Chorus 2", DURATION_CHORUS, patterns.chorus, true);
        if (includeSpecialSection) {
            addSection("Bridge/Drop", DURATION_BRIDGE_DROP, patterns.bridgeDrop.length > 0 ? patterns.bridgeDrop : patterns.instrumental);
        }
        addSection("Climax Chorus", DURATION_CLIMAX, patterns.climax.length > 0 ? patterns.climax : patterns.chorus); // More intense chorus
        addSection("Outro", DURATION_OUTRO, patterns.outro.length > 0 ? patterns.outro : [{ time: "0:0", instrument: 'pad', note: ["C3","E3","G3"], duration: "1m", velocity: 0.2}]);


    } else if (genre === 'bolero_trữ_tình') {
        // Define intro, verse, chorus, giangTau, climax, outro for Bolero
        // Example structure (you need to fill in the actual Tone.js events for each pattern array)
        patterns.intro = [ /* Bolero intro events from V8 or new */ ];
        patterns.verse = [ /* Bolero verse events - sparse for vocals */ ];
        patterns.chorus = [ /* Bolero chorus events - fuller */ ];
        patterns.giangTau = [ /* Bolero instrumental break events */ ]; // This is the "drop" for Bolero
        patterns.climax = [ /* Bolero climax events - e.g., last chorus with more instruments/intensity */ ];
        patterns.outro = [ /* Bolero outro events */ ];

        addSection("Intro", DURATION_INTRO, patterns.intro);
        addSection("Verse 1", DURATION_VERSE, patterns.verse, true);
        addSection("Chorus 1", DURATION_CHORUS, patterns.chorus, true);
        if (includeSpecialSection) {
             addSection("Giang Tấu", DURATION_BRIDGE_DROP, patterns.giangTau);
        }
        addSection("Verse 2", DURATION_VERSE, patterns.verse, true);
        addSection("Chorus 2 (Climax)", DURATION_CLIMAX, patterns.climax.length > 0 ? patterns.climax : patterns.chorus);
        addSection("Outro", DURATION_OUTRO, patterns.outro);

    } else if (genre === 'vpop_sontung_style' || genre === 'vpop_jack_style' || genre === 'edm_remix_full') {
        // TODO: Define detailed multi-section patterns for these genres.
        // This requires careful design of intro, verse, pre-chorus, chorus, drop, bridge, outro for each.
        // For now, using a simplified structure as a placeholder:
        patterns.intro = [ {time: "0:0", instrument: 'kick', note: 'C1', duration: "1m"} ];
        patterns.verse = [ {time: "0:0", instrument: 'kick', note: 'C1'}, {time: "0:2", instrument: 'snare', note: 'D2'} ];
        patterns.chorus = [ {time: "0:0", instrument: 'kick', note: 'C1', velocity: 0.9}, {time: "0:2", instrument: 'snare', note: 'D2', velocity: 0.9} ];
        patterns.drop = [ {time: "0:0", instrument: 'kick_edm_hard', note: 'C1', velocity: 1.0} ];

        addSection("Intro", DURATION_INTRO, patterns.intro);
        addSection("Verse 1", DURATION_VERSE, patterns.verse, true);
        addSection("Chorus 1", DURATION_CHORUS, patterns.chorus, true);
        if (includeSpecialSection) {
            addSection("Drop/Build", DURATION_BRIDGE_DROP, patterns.drop);
        }
        addSection("Verse 2", DURATION_VERSE, patterns.verse, true);
        addSection("Chorus 2 (Climax)", DURATION_CLIMAX, patterns.chorus); // Use chorus as placeholder for climax
        addSection("Outro", DURATION_OUTRO, [{ time: "0:0", instrument: 'kick', note: 'C1', duration: "1m"}]); // Simple outro
    }

    // Fallback if no specific structure was built
    if (songStructure.length === 0) {
        console.warn(`Using fallback song structure for genre: ${genre}`);
        patterns.intro = []; // No intro for fallback
        patterns.verse = [ { time: "0:0", instrument: 'kick', note: 'C1' }, { time: "0:2", instrument: 'snare', note: 'C2' }];
        
        addSection("Verse 1", DURATION_VERSE, patterns.verse, true);
        addSection("Verse 2", DURATION_VERSE, patterns.verse, true); // Repeat vocal
        // Add some instrumental part to reach a decent length
        const instrumentalPartDuration = Math.max(measureTime * 8, 30); // At least 30s or 8 bars
        addSection("Instrumental Outro", instrumentalPartDuration, patterns.verse);
    }
    
    const totalCalculatedDuration = songStructure.reduce((sum, section) => sum + section.duration, 0);

    return {
        sections: songStructure,
        totalDuration: totalCalculatedDuration
    };
}