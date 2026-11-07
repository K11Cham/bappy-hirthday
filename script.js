/* =========================================================
   QUOTE-O-TRON 9000
   script.js
========================================================= */


/* =========================================================
   QUOTES
========================================================= */

/*
 * My lawyer has advised me not to leave these quotes public.
 * The real ones live in the copy my brother got.
 */

const quotes = [
  "[REDACTED on legal advice]",
  "[quote withheld pending litigation]",
  "[this one was especially bad]",
  "[my lawyer is crying]",
  "[censored for your protection]",
  "[ask Kayleb]",
  "[nope]",
  "*epic fart*",
  "[REDACTED, again]"
];

/*
 * EPIC FART is special — it's a ~3% chance per shuffle instead of
 * a flat 1/9 (~11%). When it hits, a ridiculous special effect
 * and sound effect play on top of the normal reveal.
 */

const EPIC_FART_INDEX =
  quotes.indexOf(
    "*epic fart*"
  );

const EPIC_FART_RATE = 0.03;


/* =========================================================
   CHAOTIC PROCESSING MESSAGES
========================================================= */

const loadingMessages = [
  "Cookin up straight poison...",
  "Ripping one out...",
  "Mingling my dingle...",
  "Making fun of Kayleb...",
  "Consulting the ancient archives...",
  "Stealing the quote...",
  "Microwaving the nonsense...",
  "Applying unnecessary bass...",
  "Increasing stupidity...",
  "Removing all brain cells...",
  "Generating absolute garbage...",
  "Searching the Kameron database...",
  "Downloading questionable memories...",
  "Turning the stupid dial to MAX...",
  "Distilling pure bullshit...",
  "Locating the funny...",
  "Beating the quote with a stick...",
  "Injecting unnecessary drama...",
  "Making this take way too long...",
  "Asking the council...",
  "Consulting a highly qualified idiot...",
  "Compressing the Kayleb...",
  "Releasing the demons..."
];


/* =========================================================
   YOUTUBE SONGS
========================================================= */

const memeSongs = [
  "JAfHQVgipqs"
];


/* =========================================================
   ELEMENTS
========================================================= */

const btn =
  document.getElementById("shuffleBtn");

const overlay =
  document.getElementById("introOverlay");

const flash =
  document.getElementById("flash");

const flare =
  document.getElementById("flare");

const flare2 =
  document.getElementById("flare2");

const countdownEl =
  document.getElementById("countdownNum");

const goEl =
  document.getElementById("goText");

const logoEl =
  document.getElementById("logoTitle");

const taglineEl =
  document.getElementById("tagline");

const loadingEl =
  document.getElementById("loadingText");

const ringEl =
  document.getElementById("ring");

const quoteWrap =
  document.getElementById("quoteReveal");

const quoteTextEl =
  document.getElementById("quoteText");

const closeHint =
  document.getElementById("closeHint");

const particleField =
  document.getElementById("particleField");

const soundToggle =
  document.getElementById("soundToggle");

const sponsorOverlay =
  document.getElementById("sponsorOverlay");

const sponsorSkip =
  document.getElementById("sponsorSkip");

const sponsorLoading =
  document.getElementById("sponsorLoading");

const whiteout =
  document.getElementById("whiteout");

const glitchOverlay =
  document.getElementById("glitchOverlay");

const shockwaveLayer =
  document.getElementById("shockwaveLayer");

const buildupTextEl =
  document.getElementById("buildupText");

const chaosBgEl =
  document.getElementById("chaosBg");


/* =========================================================
   SAFETY CHECK
========================================================= */

const requiredElements = {
  btn,
  overlay,
  flash,
  flare,
  flare2,
  countdownEl,
  goEl,
  logoEl,
  taglineEl,
  loadingEl,
  ringEl,
  quoteWrap,
  quoteTextEl,
  closeHint,
  particleField,
  soundToggle
};

for(
  const [name, element]
  of Object.entries(requiredElements)
){

  if(!element){

    console.error(
      "QUOTE-O-TRON: Missing HTML element:",
      name
    );

  }

}


/* =========================================================
   STATE
========================================================= */

let lastIndex = -1;

let soundOn = true;

let audioCtx = null;

let closable = false;

let youtubePlayer = null;

let youtubeReady = false;

let currentSong = -1;

let sponsorActive = false;

let pendingSponsorCallback = null;

let introTimers = [];

/*
 * TIMING DEBUGGER state
 *   songStartMs   : performance.now() when YouTube fires PLAYING
 *   visualDropMs  : performance.now() when showQuote() fires
 *   DROP_OFFSET_MS: how many ms after startCountdownAndDrop() the
 *                   quote should drop. Adjustable via the slider.
 *                   Persisted in localStorage so it survives reloads.
 *   SONG_DROP_MS  : where the song's audio drop lands (3.0s in the
 *                   video for JAfHQVgipqs).
 */

let songStartMs = null;

let visualDropMs = null;

const SONG_DROP_MS = 3000;

let DROP_OFFSET_MS = 3950;

try{

  const saved =
    localStorage.getItem(
      "quote-o-tron-drop-offset"
    );

  if(
    saved !== null &&
    !isNaN(Number(saved))
  ){

    DROP_OFFSET_MS =
      Number(saved);

  }

}catch(e){

  /* localStorage might be unavailable */

}


/* =========================================================
   TIMER MANAGEMENT
========================================================= */

function addTimer(
  callback,
  delay
){

  const timer =
    setTimeout(
      callback,
      delay
    );

  introTimers.push(timer);

  return timer;

}


function clearIntroTimers(){

  introTimers.forEach(
    timer => clearTimeout(timer)
  );

  introTimers = [];

}


/* =========================================================
   SOUND TOGGLE
========================================================= */

soundToggle?.addEventListener(
  "click",
  function(event){

    event.stopPropagation();

    soundOn = !soundOn;

    soundToggle.textContent =
      soundOn ? "🔊" : "🔇";

    if(!soundOn){

      stopMusic();

    }

  }
);


/* =========================================================
   WEB AUDIO
========================================================= */

function getCtx(){

  if(!audioCtx){

    audioCtx =
      new (
        window.AudioContext ||
        window.webkitAudioContext
      )();

  }

  return audioCtx;

}


function beep(
  freqStart,
  freqEnd,
  duration,
  type = "sine",
  gainPeak = .3
){

  if(!soundOn) return;

  try{

    const ctx =
      getCtx();

    if(
      ctx.state ===
      "suspended"
    ){

      ctx.resume();

    }

    const now =
      ctx.currentTime;

    const osc =
      ctx.createOscillator();

    const gain =
      ctx.createGain();

    osc.type =
      type;

    osc.frequency.setValueAtTime(
      freqStart,
      now
    );

    osc.frequency.exponentialRampToValueAtTime(
      Math.max(
        freqEnd,
        1
      ),
      now + duration
    );

    gain.gain.setValueAtTime(
      0.0001,
      now
    );

    gain.gain.exponentialRampToValueAtTime(
      gainPeak,
      now + duration * .15
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + duration
    );

    osc
      .connect(gain)
      .connect(ctx.destination);

    osc.start(now);

    osc.stop(
      now +
      duration +
      .05
    );

  }catch(error){

    console.warn(
      "Audio error:",
      error
    );

  }

}


/* =========================================================
   YOUTUBE API
========================================================= */

function loadYouTubeAPI(){

  if(
    window.YT &&
    window.YT.Player
  ){

    createYouTubePlayer();

    return;

  }

  const existingScript =
    document.querySelector(
      'script[src="https://www.youtube.com/iframe_api"]'
    );

  if(existingScript){
    return;
  }

  const script =
    document.createElement("script");

  script.src =
    "https://www.youtube.com/iframe_api";

  document.head.appendChild(
    script
  );

}


window.onYouTubeIframeAPIReady =
  createYouTubePlayer;


/* =========================================================
   CREATE YOUTUBE PLAYER
========================================================= */

function createYouTubePlayer(){

  if(youtubePlayer){
    return;
  }

  if(
    !window.YT ||
    !window.YT.Player
  ){

    return;

  }

  try{

    youtubePlayer =
      new YT.Player(
        "youtubePlayer",
        {

          height: "1",
          width: "1",

          playerVars: {

            autoplay: 0,

            controls: 0,

            disablekb: 1,

            playsinline: 1,

            rel: 0,

            modestbranding: 1,

            enablejsapi: 1

          },

          events: {

            onReady:
              function(){

                youtubeReady =
                  true;

                console.log(
                  "QUOTE-O-TRON YouTube audio ready."
                );

              },

            onStateChange:
              function(event){

                if(
                  window.YT &&
                  event.data ===
                  YT.PlayerState.PLAYING
                ){

                  /*
                   * The song has actually started playing.
                   * Record this moment for the timing debugger.
                   * (Only set if null, so replays after ENDED
                   * don't overwrite the original start time.)
                   */

                  if(songStartMs === null){

                    songStartMs =
                      performance.now();

                    const el =
                      document.getElementById(
                        "tdSongStart"
                      );

                    if(el){
                      el.textContent =
                        songStartMs.toFixed(0) +
                        "ms";
                    }

                    console.log(
                      "%c[QUOTE-O-TRON DEBUG] Song actually started playing at " +
                      songStartMs.toFixed(0) + "ms",
                      "color:#B6FF1A;font-weight:bold;"
                    );

                  }

                }

                if(
                  window.YT &&
                  event.data ===
                  YT.PlayerState.ENDED
                ){

                  playRandomSong();

                }

              },

            onError:
              function(error){

                console.warn(
                  "QUOTE-O-TRON YouTube error:",
                  error
                );

              }

          }

        }
      );

  }catch(error){

    console.warn(
      "QUOTE-O-TRON could not create YouTube player:",
      error
    );

  }

}


/* =========================================================
   RANDOM SONG
========================================================= */

function getRandomSong(){

  if(
    memeSongs.length === 0
  ){

    return null;

  }

  let index;

  do{

    index =
      Math.floor(
        Math.random() *
        memeSongs.length
      );

  }while(
    memeSongs.length > 1 &&
    index === currentSong
  );

  currentSong =
    index;

  return memeSongs[index];

}


/* =========================================================
   PLAY MUSIC
========================================================= */

function playRandomSong(){

  if(
    !soundOn ||
    !youtubeReady ||
    !youtubePlayer
  ){

    return;

  }

  const song =
    getRandomSong();

  if(!song){
    return;
  }

  try{

    youtubePlayer.setVolume(
      80
    );

    youtubePlayer.loadVideoById(
      {
        videoId: song,
        startSeconds: 0
      }
    );

    youtubePlayer.playVideo();

  }catch(error){

    console.warn(
      "YouTube playback failed:",
      error
    );

  }

}


/* =========================================================
   START MUSIC
========================================================= */

function startMusic(){

  if(
    !soundOn ||
    !youtubeReady ||
    !youtubePlayer
  ){

    console.warn(
      "QUOTE-O-TRON: YouTube player not ready."
    );

    return;

  }

  const song =
    getRandomSong();

  if(!song){
    return;
  }

  try{

    youtubePlayer.setVolume(
      80
    );

    /*
     * Reset the debugger's song-start timestamp so the next
     * play can capture a fresh PLAYING event.
     */

    songStartMs =
      null;

    const ssEl =
      document.getElementById(
        "tdSongStart"
      );

    if(ssEl){
      ssEl.textContent = "—";
    }

    /*
     * IMPORTANT:
     *
     * Always start the song at exactly 0.
     * The quote reveal happens at DROP_OFFSET_MS after
     * startCountdownAndDrop() begins. Use the timing
     * debugger slider to dial in the perfect value for
     * the user's machine/network.
     */

    youtubePlayer.loadVideoById(
      {
        videoId: song,
        startSeconds: 0
      }
    );

    youtubePlayer.playVideo();

    console.log(
      "QUOTE-O-TRON: Music started at 0:00 — quote drop at +3.00s."
    );

  }catch(error){

    console.warn(
      "QUOTE-O-TRON: Could not start YouTube audio.",
      error
    );

  }

}


/* =========================================================
   STOP MUSIC
========================================================= */

function stopMusic(){

  if(
    !youtubePlayer ||
    !youtubeReady
  ){

    return;

  }

  try{

    youtubePlayer.pauseVideo();

    youtubePlayer.seekTo(
      0,
      true
    );

  }catch(error){

    console.warn(
      "QUOTE-O-TRON: Could not stop YouTube audio.",
      error
    );

  }

}


/* =========================================================
   FLASH
========================================================= */

function hitFlash(){

  if(!flash) return;

  flash.classList.remove(
    "hit"
  );

  void flash.offsetWidth;

  flash.classList.add(
    "hit"
  );

}


/* =========================================================
   SHAKE
========================================================= */

function hitShake(){

  if(!overlay) return;

  overlay.classList.remove(
    "shake"
  );

  void overlay.offsetWidth;

  overlay.classList.add(
    "shake"
  );

}


/* =========================================================
   FLARES
========================================================= */

function sweepFlares(){

  if(flare){

    flare.classList.remove(
      "sweep"
    );

    void flare.offsetWidth;

    flare.classList.add(
      "sweep"
    );

  }

  if(flare2){

    flare2.classList.remove(
      "sweep"
    );

    void flare2.offsetWidth;

    flare2.classList.add(
      "sweep"
    );

  }

}


/* =========================================================
   PARTICLES
========================================================= */

function spawnParticles(
  count,
  colors
){

  if(!particleField) return;

  for(
    let i = 0;
    i < count;
    i++
  ){

    const p =
      document.createElement(
        "div"
      );

    p.className =
      "particle";

    const angle =
      Math.random() *
      Math.PI *
      2;

    const distance =
      160 +
      Math.random() *
      400;

    p.style.setProperty(
      "--tx",
      Math.cos(angle) *
      distance +
      "px"
    );

    p.style.setProperty(
      "--ty",
      Math.sin(angle) *
      distance +
      "px"
    );

    p.style.background =
      colors[
        Math.floor(
          Math.random() *
          colors.length
        )
      ];

    const size =
      5 +
      Math.random() *
      15;

    p.style.width =
      size + "px";

    p.style.height =
      size + "px";

    p.style.borderRadius =
      Math.random() > .5
        ? "50%"
        : "0";

    particleField.appendChild(
      p
    );

    requestAnimationFrame(
      () => {

        p.classList.add(
          "burstAnim"
        );

      }
    );

    setTimeout(
      () => p.remove(),
      1200
    );

  }

}


/* =========================================================
   RESET
========================================================= */

function hitWhiteout(){

  if(!whiteout) return;

  whiteout.classList.remove(
    "fire"
  );

  void whiteout.offsetWidth;

  whiteout.classList.add(
    "fire"
  );

}


function hitGlitch(){

  if(!glitchOverlay) return;

  glitchOverlay.classList.remove(
    "fire"
  );

  void glitchOverlay.offsetWidth;

  glitchOverlay.classList.add(
    "fire"
  );

}


function hitDistortion(){

  if(!overlay) return;

  overlay.classList.remove(
    "distort"
  );

  void overlay.offsetWidth;

  overlay.classList.add(
    "distort"
  );

}


function fireShockwave(color){

  if(!shockwaveLayer) return;

  const wave =
    document.createElement(
      "div"
    );

  wave.className =
    "shockwave";

  if(color){

    wave.style.borderColor =
      color;

    wave.style.boxShadow =
      "0 0 40px " + color;

  }

  shockwaveLayer.appendChild(
    wave
  );

  requestAnimationFrame(
    function(){

      wave.classList.add(
        "fire"
      );

    }
  );

  setTimeout(
    function(){

      wave.remove();

    },
    1100
  );

}


function flashChaosBg(){

  if(!chaosBgEl) return;

  const colors = [
    "#FF1E1E",
    "#FF7A00",
    "#FFD700",
    "#B6FF1A",
    "#00F0FF",
    "#1B4DFF",
    "#8B00FF",
    "#FF00C8"
  ];

  chaosBgEl.style.background =
    colors[
      Math.floor(
        Math.random() *
        colors.length
      )
    ];

  chaosBgEl.classList.remove(
    "flash"
  );

  void chaosBgEl.offsetWidth;

  chaosBgEl.classList.add(
    "flash"
  );

}


const buildupPhrases = [
  "BRACE YOURSELF",
  "HERE IT COMES",
  "READY?",
  "WAIT FOR IT...",
  "OH NO",
  "GET READY",
  "3...",
  "2...",
  "1...",
  "NOW",
  "UH OH",
  "KAMERON...",
  "WARNING",
  "DANGER",
  "HERE WE GO"
];


function showBuildupText(){

  if(!buildupTextEl){
    return;
  }

  const phrase =
    buildupPhrases[
      Math.floor(
        Math.random() *
        buildupPhrases.length
      )
    ];

  buildupTextEl.textContent =
    phrase;

  buildupTextEl.classList.remove(
    "show"
  );

  void buildupTextEl.offsetWidth;

  buildupTextEl.classList.add(
    "show"
  );

  beep(
    400 +
    Math.random() * 800,

    100 +
    Math.random() * 300,

    .1,

    "square",

    .15
  );

}


function resetOverlayVisuals(){

  if(!overlay) return;

  [
    logoEl,
    taglineEl,
    loadingEl,
    quoteWrap,
    ringEl,
    goEl,
    closeHint,
    countdownEl
  ].forEach(
    element => {

      if(element){

        element.classList.remove(
          "show",
          "pop"
        );

      }

    }
  );

  if(quoteWrap){

    quoteWrap.classList.remove(
      "fart-mode"
    );

  }

  if(countdownEl){

    countdownEl.textContent =
      "";

  }

  if(loadingEl){

    loadingEl.textContent =
      "";

  }

  if(particleField){

    particleField.innerHTML =
      "";

  }

  if(shockwaveLayer){

    shockwaveLayer.innerHTML =
      "";

  }

  if(buildupTextEl){

    buildupTextEl.classList.remove(
      "show"
    );

    buildupTextEl.textContent =
      "";

  }

  if(whiteout){

    whiteout.classList.remove(
      "fire"
    );

  }

  if(glitchOverlay){

    glitchOverlay.classList.remove(
      "fire"
    );

  }

  if(chaosBgEl){

    chaosBgEl.classList.remove(
      "flash"
    );

  }

  if(quoteWrap){

    quoteWrap.classList.remove(
      "settle"
    );

  }

  if(overlay){

    overlay.classList.remove(
      "buildup",
      "distort"
    );

  }

}


/* =========================================================
   COUNTDOWN
========================================================= */

function showNum(number){

  if(!countdownEl) return;

  countdownEl.textContent =
    number;

  countdownEl.classList.remove(
    "pop"
  );

  void countdownEl.offsetWidth;

  countdownEl.classList.add(
    "pop"
  );

  hitFlash();

  hitShake();

  beep(
    220,
    70,
    .25,
    "square",
    .25
  );

}


/* =========================================================
   GO
========================================================= */

function showGo(){

  if(!goEl) return;

  goEl.classList.remove(
    "pop"
  );

  void goEl.offsetWidth;

  goEl.classList.add(
    "pop"
  );

  hitFlash();

  hitShake();

  sweepFlares();

  beep(
    500,
    900,
    .3,
    "square",
    .35
  );

}


/* =========================================================
   LOGO
========================================================= */

function startLogo(){

  hitFlash();

  hitShake();

  sweepFlares();

  beep(
    90,
    40,
    .6,
    "sawtooth",
    .35
  );

  logoEl?.classList.add(
    "show"
  );

  taglineEl?.classList.add(
    "show"
  );

  spawnParticles(
    80,
    [
      "#FFD700",
      "#00F0FF",
      "#FF00C8",
      "#8B00FF",
      "#3DD1FF"
    ]
  );

}


/* =========================================================
   RANDOM PROCESSING MESSAGES
========================================================= */

function shuffleArray(array){

  const result =
    [...array];

  for(
    let i =
      result.length - 1;
    i > 0;
    i--
  ){

    const j =
      Math.floor(
        Math.random() *
        (i + 1)
      );

    [
      result[i],
      result[j]
    ] =
    [
      result[j],
      result[i]
    ];

  }

  return result;

}


function startLoading(onComplete){

  const messages =
    shuffleArray(
      loadingMessages
    );

  const amount =
    3 +
    Math.floor(
      Math.random() * 4
    );

  const selected =
    messages.slice(
      0,
      amount
    );

  let index =
    0;

  function next(){

    if(!loadingEl){
      return;
    }

    loadingEl.textContent =
      selected[index];

    loadingEl.classList.remove(
      "show"
    );

    void loadingEl.offsetWidth;

    loadingEl.classList.add(
      "show"
    );

    beep(
      300 +
      Math.random() * 600,

      700 +
      Math.random() * 600,

      .15,

      "square",

      .12
    );

    index++;

    if(
      index <
      selected.length
    ){

      addTimer(
        next,
        350 +
        Math.random() * 250
      );

    }else{

      /*
       * All loading messages have been shown.
       * Wait a beat so the last one is readable,
       * then fire the callback so the countdown
       * and music can begin.
       */

      addTimer(
        function(){

          loadingEl?.classList.remove(
            "show"
          );

          if(onComplete){
            onComplete();
          }

        },
        500
      );

    }

  }

  next();

}


/* =========================================================
   QUOTE REVEAL
========================================================= */

function triggerEpicFartEffect(){

  /*
   * Spawn a green gas cloud of particles
   */

  const fartColors = [
    "#7CFC00",
    "#ADFF2F",
    "#32CD32",
    "#228B22",
    "#90EE90",
    "#98FB98",
    "#FFD23F"
  ];

  spawnParticles(
    60,
    fartColors
  );

  setTimeout(
    function(){

      spawnParticles(
        40,
        fartColors
      );

    },
    200
  );

  setTimeout(
    function(){

      spawnParticles(
        30,
        fartColors
      );

    },
    500
  );

  /*
   * Extra screen distortion
   */

  hitDistortion();

  setTimeout(
    function(){

      hitDistortion();

    },
    300
  );

  /*
   * The fart sound — a descending series of buzzy tones
   * that get progressively more ridiculous.
   */

  if(soundOn){

    beep(
      200,
      80,
      .4,
      "sawtooth",
      .4
    );

    setTimeout(
      function(){

        beep(
          160,
          60,
          .35,
          "sawtooth",
          .4
        );

      },
      150
    );

    setTimeout(
      function(){

        beep(
          120,
          40,
          .5,
          "sawtooth",
          .45
        );

      },
      300
    );

    setTimeout(
      function(){

        beep(
          80,
          30,
          .6,
          "sawtooth",
          .4
        );

      },
      500
    );

    /*
     * Final squeak
     */

    setTimeout(
      function(){

        beep(
          1000,
          200,
          .15,
          "square",
          .2
        );

      },
      900
    );

  }

  /*
   * Flash the overlay green briefly
   */

  if(chaosBgEl){

    chaosBgEl.style.background =
      "#7CFC00";

    chaosBgEl.classList.remove(
      "flash"
    );

    void chaosBgEl.offsetWidth;

    chaosBgEl.classList.add(
      "flash"
    );

  }

}


function showQuote(){

  let index;

  /*
   * EPIC FART ROLL — 3% chance to force the epic fart, but never
   * twice in a row. Otherwise pick a random quote, excluding the
   * last one shown and (usually) excluding the epic fart so it
   * stays rare.
   */

  const fartRoll =
    Math.random();

  if(
    fartRoll < EPIC_FART_RATE &&
    lastIndex !== EPIC_FART_INDEX
  ){

    index = EPIC_FART_INDEX;

  }else{

    /*
     * Build a pool of candidates: all quotes except the last one
     * shown. The epic fart stays in the pool at its normal weight
     * so it can still come up naturally, but the forced-roll above
     * is what makes it feel "rare but possible."
     */

    const pool = [];

    for(
      let i = 0;
      i < quotes.length;
      i++
    ){

      if(i !== lastIndex){

        pool.push(i);

      }

    }

    index =
      pool[
        Math.floor(
          Math.random() *
          pool.length
        )
      ];

  }

  lastIndex =
    index;

  /*
   * Track seen quotes for the "Quote Collector" achievement.
   */

  seenQuotes[index] = true;

  saveAchievementState();

  if(
    Object.keys(seenQuotes).length ===
    quotes.length
  ){

    setTimeout(
      function(){

        unlockAchievement(
          "all-quotes"
        );

      },
      2000
    );

  }

  /*
   * Epic fart achievement + special effect flag
   */

  const isEpicFart =
    index === EPIC_FART_INDEX;

  if(isEpicFart){

    setTimeout(
      function(){

        unlockAchievement(
          "epic-fart"
        );

      },
      2000
    );

  }

  const text =
    quotes[index];

  const display =
    `"${text}"`;

  if(quoteTextEl){

    quoteTextEl.textContent =
      display;

    quoteTextEl.setAttribute(
      "data-text",
      display
    );

  }

  if(quoteWrap){

    if(
      text === "*epic fart*"
    ){

      quoteWrap.classList.add(
        "fart-mode"
      );

    }else{

      quoteWrap.classList.remove(
        "fart-mode"
      );

    }

  }

  ringEl?.classList.add(
    "show"
  );

  quoteWrap?.classList.remove(
    "show"
  );

  quoteWrap?.classList.remove(
    "settle"
  );

  void quoteWrap?.offsetWidth;

  /*
   * TIMING DEBUGGER: record the visual drop moment and
   * compute the offset vs the audio drop.
   */

  visualDropMs =
    performance.now();

  const vdEl =
    document.getElementById(
      "tdVisualDrop"
    );

  if(vdEl){
    vdEl.textContent =
      visualDropMs.toFixed(0) +
      "ms";
  }

  if(songStartMs !== null){

    const audioDropMs =
      songStartMs + SONG_DROP_MS;

    const offsetMs =
      visualDropMs - audioDropMs;

    const adEl =
      document.getElementById(
        "tdAudioDrop"
      );

    if(adEl){
      adEl.textContent =
        audioDropMs.toFixed(0) +
        "ms";
    }

    const offEl =
      document.getElementById(
        "tdOffsetVal"
      );

    if(offEl){

      const sign =
        offsetMs > 0 ? "+" : "";

      offEl.textContent =
        sign +
        offsetMs.toFixed(0) +
        "ms";

      offEl.classList.remove(
        "good",
        "lead",
        "lag"
      );

      if(
        Math.abs(offsetMs) <= 100
      ){

        offEl.classList.add(
          "good"
        );

      }else if(offsetMs < 0){

        offEl.classList.add(
          "lead"
        );

      }else{

        offEl.classList.add(
          "lag"
        );

      }

    }

    console.log(
      "%c[QUOTE-O-TRON DEBUG] Visual drop at " +
      visualDropMs.toFixed(0) + "ms  |  " +
      "Audio drop at " + audioDropMs.toFixed(0) + "ms  |  " +
      "Offset = " + (offsetMs > 0 ? "+" : "") +
      offsetMs.toFixed(0) + "ms",
      "color:#FFD700;font-weight:bold;font-size:14px;"
    );

    console.log(
      "%c  Target = 0ms.  If offset is positive, DECREASE DROP_OFFSET.  " +
      "If negative, INCREASE it.",
      "color:#aaa;"
    );

  }

  /*
   * PRE-REVEAL: white-out flash + glitch + distortion
   */

  hitWhiteout();

  hitGlitch();

  hitDistortion();

  /*
   * Spawn 4 shockwave rings, staggered 80ms each
   */

  const shockColors = [
    "#FFFFFF",
    "#FF00C8",
    "#00F0FF",
    "#FFD700"
  ];

  for(
    let i = 0;
    i < 4;
    i++
  ){

    addTimer(
      function(){

        fireShockwave(
          shockColors[i]
        );

      },
      i * 80
    );

  }

  /*
   * MEGA-BURST: 200 particles in two waves
   */

  spawnParticles(
    120,
    [
      "#FFD700",
      "#FF2E9A",
      "#B6FF1A",
      "#1B4DFF",
      "#FF1E1E",
      "#FF7A00",
      "#FFFFFF",
      "#FF00C8",
      "#00F0FF"
    ]
  );

  /*
   * EPIC FART SPECIAL EFFECT
   * If this is the epic fart, layer on a ridiculous green gas
   * cloud, screen distortion, and a multi-tone fart sound.
   */

  if(isEpicFart){

    triggerEpicFartEffect();

  }

  addTimer(
    function(){

      spawnParticles(
        80,
        [
          "#FFFFFF",
          "#FFD700",
          "#FF00C8",
          "#00F0FF"
        ]
      );

    },
    150
  );

  /*
   * Trigger the quote reveal zoom.
   * The .show class fires quoteZoomDramatic.
   */

  quoteWrap?.classList.add(
    "show"
  );

  /*
   * After the dramatic zoom settles, switch to the
   * continuous settle wobble so it stays alive.
   */

  addTimer(
    function(){

      quoteWrap?.classList.remove(
        "show"
      );

      quoteWrap?.classList.add(
        "settle"
      );

    },
    950
  );

  /*
   * Hits: flash, shake, flares, distortion echo
   */

  hitFlash();

  hitShake();

  sweepFlares();

  addTimer(
    function(){

      hitFlash();

      hitShake();

      hitGlitch();

    },
    200
  );

  /*
   * Audio: deep boom + high sparkle
   */

  beep(
    160,
    40,
    .8,
    "sine",
    .5
  );

  beep(
    1200,
    200,
    .3,
    "square",
    .15
  );

  addTimer(
    function(){

      beep(
        80,
        30,
        1.2,
        "sine",
        .4
      );

    },
    100
  );

  addTimer(
    enableClose,
    1100
  );

}


/* =========================================================
   CLOSE
========================================================= */

function enableClose(){

  closable =
    true;

  closeHint?.classList.add(
    "show"
  );

  if(btn){

    btn.disabled =
      false;

  }

}


function closeOverlay(){

  if(!closable){
    return;
  }

  clearIntroTimers();

  stopMusic();

  pendingSponsorCallback =
    null;

  hideSponsor();

  overlay?.classList.remove(
    "active"
  );

  overlay?.setAttribute(
    "aria-hidden",
    "true"
  );

  closable =
    false;

  resetOverlayVisuals();

}


/* =========================================================
   SPONSOR POPUP
========================================================= */

const sponsorConfigs = [
  {
    brand:"WAR THUNDER",
    tagline:"GET IN THE FIGHT\u2122",
    theme:"war-thunder",
    loadingMessages:[
      "LOADING ADVERTISEMENT...",
      "CONTACTING SPONSOR...",
      "CALCULATING PROFIT...",
      "PREPARING MILITARY-GRADE AD...",
      "PLEASE ENJOY THIS COMPLETELY REAL INTERRUPTION..."
    ]
  },
  {
    brand:"RAID SHADOW LEGENDS",
    tagline:"PLAY FREE NOW",
    theme:"raid-legends",
    loadingMessages:[
      "LOADING ADVERTISEMENT...",
      "CONTACTING SPONSOR...",
      "CALCULATING PROFIT...",
      "SUMMONING CHAMPIONS...",
      "PLEASE ENJOY THIS COMPLETELY REAL INTERRUPTION..."
    ]
  }
];


/* =========================================================
   ACHIEVEMENTS SYSTEM
========================================================= */

const ACHIEVEMENTS = [
  {
    id:"all-quotes",
    name:"QUOTE COLLECTOR",
    desc:"Unleash every single quote at least once.",
    icon:"📚"
  },
  {
    id:"all-sponsors",
    name:"SPONSOR SURVIVOR",
    desc:"Sit through both War Thunder AND Raid Shadow Legends.",
    icon:"💰"
  },
  {
    id:"epic-fart",
    name:"FART MASTER",
    desc:"Witness the legendary *epic fart*.",
    icon:"💨"
  },
  {
    id:"read-message",
    name:"HEARTFELT",
    desc:"Read the message written for you.",
    icon:"💌"
  },
  {
    id:"completionist",
    name:"COMPLETIONIST",
    desc:"Unlock every other achievement.",
    icon:"👑"
  }
];

let unlockedAchievements = {};

let seenQuotes = {};

let seenSponsors = {};

let messageRead = false;

function loadAchievementState(){

  try{

    unlockedAchievements =
      JSON.parse(
        localStorage.getItem(
          "quote-o-tron-achievements"
        ) || "{}"
      );

    seenQuotes =
      JSON.parse(
        localStorage.getItem(
          "quote-o-tron-seen-quotes"
        ) || "{}"
      );

    seenSponsors =
      JSON.parse(
        localStorage.getItem(
          "quote-o-tron-seen-sponsors"
        ) || "{}"
      );

    messageRead =
      localStorage.getItem(
        "quote-o-tron-message-read"
      ) === "true";

  }catch(e){

    unlockedAchievements = {};
    seenQuotes = {};
    seenSponsors = {};
    messageRead = false;

  }

}

function saveAchievementState(){

  try{

    localStorage.setItem(
      "quote-o-tron-achievements",
      JSON.stringify(unlockedAchievements)
    );

    localStorage.setItem(
      "quote-o-tron-seen-quotes",
      JSON.stringify(seenQuotes)
    );

    localStorage.setItem(
      "quote-o-tron-seen-sponsors",
      JSON.stringify(seenSponsors)
    );

    localStorage.setItem(
      "quote-o-tron-message-read",
      String(messageRead)
    );

  }catch(e){

    /* ignore */

  }

}

function unlockAchievement(id){

  if(
    unlockedAchievements[id]
  ){

    return;

  }

  const achievement =
    ACHIEVEMENTS.find(
      function(a){
        return a.id === id;
      }
    );

  if(!achievement){
    return;
  }

  unlockedAchievements[id] =
    Date.now();

  saveAchievementState();

  showAchievementToast(
    achievement
  );

  /*
   * Check for completionist — all other achievements unlocked
   */

  const others =
    ACHIEVEMENTS.filter(
      function(a){
        return a.id !== "completionist";
      }
    );

  const allOthers =
    others.every(
      function(a){
        return unlockedAchievements[a.id];
      }
    );

  if(allOthers){

    setTimeout(
      function(){

        unlockAchievement(
          "completionist"
        );

      },
      1200
    );

  }

  renderAchievementsBadge();

}

function showAchievementToast(achievement){

  const toast =
    document.createElement(
      "div"
    );

  toast.className =
    "achievement-toast";

  toast.innerHTML =
    '<div class="at-icon">' +
      achievement.icon +
    '</div>' +
    '<div class="at-content">' +
      '<div class="at-label">ACHIEVEMENT UNLOCKED</div>' +
      '<div class="at-name">' + achievement.name + '</div>' +
      '<div class="at-desc">' + achievement.desc + '</div>' +
    '</div>';

  document.body.appendChild(
    toast
  );

  requestAnimationFrame(
    function(){

      toast.classList.add(
        "show"
      );

    }
  );

  /*
   * Play a little fanfare
   */

  beep(
    523,
    523,
    .12,
    "square",
    .2
  );

  setTimeout(
    function(){

      beep(
        659,
        659,
        .12,
        "square",
        .2
      );

    },
    120
  );

  setTimeout(
    function(){

      beep(
        784,
        784,
        .2,
        "square",
        .25
      );

    },
    240
  );

  setTimeout(
    function(){

      toast.classList.remove(
        "show"
      );

      setTimeout(
        function(){

          toast.remove();

        },
        500
      );

    },
    4500
  );

}

function renderAchievementsBadge(){

  const badge =
    document.getElementById(
      "achievementsBadge"
    );

  if(!badge){
    return;
  }

  const unlockedCount =
    Object.keys(
      unlockedAchievements
    ).length;

  const total =
    ACHIEVEMENTS.length;

  badge.textContent =
    unlockedCount + "/" + total;

  if(
    unlockedCount === total
  ){

    badge.classList.add(
      "complete"
    );

  }else{

    badge.classList.remove(
      "complete"
    );

  }

}

function renderAchievementsMenu(){

  const list =
    document.getElementById(
      "achievementsList"
    );

  if(!list){
    return;
  }

  list.innerHTML = "";

  ACHIEVEMENTS.forEach(
    function(a){

      const unlocked =
        !!unlockedAchievements[a.id];

      const item =
        document.createElement(
          "div"
        );

      item.className =
        "achievement-item" +
        (unlocked ? " unlocked" : " locked");

      item.innerHTML =
        '<div class="ai-icon">' +
          (unlocked ? a.icon : "🔒") +
        '</div>' +
        '<div class="ai-content">' +
          '<div class="ai-name">' + a.name + '</div>' +
          '<div class="ai-desc">' + a.desc + '</div>' +
        '</div>' +
        '<div class="ai-status">' +
          (unlocked ? "✓" : "—") +
        '</div>';

      list.appendChild(
        item
      );

    }
  );

}

loadAchievementState();


function showSponsorPopup(onSkip){

  if(!sponsorOverlay){
    return;
  }

  sponsorActive =
    true;

  pendingSponsorCallback =
    onSkip || null;

  sponsorOverlay.classList.add(
    "active"
  );

  /*
   * Pick a random sponsor (War Thunder or Raid Shadow Legends)
   * and set the brand text, tagline, theme class, and loading
   * messages accordingly.
   */

  const sponsor =
    sponsorConfigs[
      Math.floor(
        Math.random() *
        sponsorConfigs.length
      )
    ];

  const brandEl =
    sponsorOverlay.querySelector(
      ".sponsor-brand"
    );

  const taglineEl =
    sponsorOverlay.querySelector(
      ".sponsor-tagline"
    );

  if(brandEl){
    brandEl.textContent =
      sponsor.brand;
  }

  if(taglineEl){
    taglineEl.textContent =
      sponsor.tagline;
  }

  sponsorOverlay.classList.remove(
    "theme-war-thunder",
    "theme-raid-legends"
  );

  sponsorOverlay.classList.add(
    "theme-" + sponsor.theme
  );

  /*
   * Track seen sponsors for the "Sponsor Survivor" achievement.
   */

  seenSponsors[sponsor.theme] = true;

  saveAchievementState();

  if(
    Object.keys(seenSponsors).length >=
    sponsorConfigs.length
  ){

    /*
     * Defer the unlock so it doesn't fire while the sponsor
     * popup is covering the screen.
     */

    setTimeout(
      function(){

        unlockAchievement(
          "all-sponsors"
        );

      },
      3000
    );

  }

  if(sponsorLoading){

    const messages =
      sponsor.loadingMessages;

    let index =
      0;

    sponsorLoading.textContent =
      messages[index];

    const interval =
      setInterval(
        () => {

          if(
            !sponsorActive
          ){

            clearInterval(
              interval
            );

            return;

          }

          index =
            (index + 1) %
            messages.length;

          sponsorLoading.textContent =
            messages[index];

        },
        550
      );

    sponsorOverlay.dataset.loadingInterval =
      String(interval);

  }

}


function hideSponsor(){

  if(!sponsorOverlay){
    return;
  }

  sponsorActive =
    false;

  sponsorOverlay.classList.remove(
    "active"
  );

  if(
    sponsorOverlay.dataset.loadingInterval
  ){

    clearInterval(
      Number(
        sponsorOverlay.dataset.loadingInterval
      )
    );

    delete sponsorOverlay.dataset.loadingInterval;

  }

}


/* =========================================================
   SPONSOR SKIP
========================================================= */

sponsorSkip?.addEventListener(
  "click",
  function(event){

    event.stopPropagation();

    hideSponsor();

    /*
     * If the sponsor was shown as a pre-roll
     * before the intro, kick off the intro
     * now that the user has skipped.
     */

    if(
      typeof pendingSponsorCallback ===
      "function"
    ){

      const cb =
        pendingSponsorCallback;

      pendingSponsorCallback =
        null;

      cb();

    }

  }
);


/* =========================================================
   MAIN INTRO
========================================================= */

function playIntro(){

  if(
    !overlay ||
    overlay.classList.contains(
      "active"
    )
  ){

    return;

  }

  clearIntroTimers();

  hideSponsor();

  resetOverlayVisuals();

  closable =
    false;

  pendingSponsorCallback =
    null;

  overlay.classList.add(
    "active"
  );

  overlay.setAttribute(
    "aria-hidden",
    "false"
  );

  btn.disabled =
    true;


  /* ---------------------------------------------------------
     5% RICKROLL
     Redirect away. No music, no intro.
  --------------------------------------------------------- */

  if(
    Math.random() < .05
  ){

    window.location.href =
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

    return;

  }


  /* ---------------------------------------------------------
     20% SPONSOR
     Show the pre-roll ad. No music plays during the ad.
     When the user clicks SKIP AD, the intro begins.
  --------------------------------------------------------- */

  if(
    Math.random() < .20
  ){

    showSponsorPopup(
      function(){

        startIntroSequence();

      }
    );

    return;

  }


  /* ---------------------------------------------------------
     NO SPONSOR — start the intro immediately
  --------------------------------------------------------- */

  startIntroSequence();

}


/* =========================================================
   INTRO SEQUENCE
   Phase 1: Loading messages  (fully waited on)
   Phase 2: Countdown + music (3.000s window)
   Phase 3: Quote drop        (synced to music drop at +3.000s)
========================================================= */

function startIntroSequence(){

  /*
   * PHASE 1 — LOADING
   *
   * Show chaotic loading messages on top of the burst
   * background. This phase is fully waited on: the
   * countdown and music do NOT begin until every selected
   * loading message has been displayed and the callback
   * fires.
   *
   * No music plays during this phase.
   */

  hitFlash();

  hitShake();

  sweepFlares();

  startLoading(
    function(){

      startCountdownAndDrop();

    }
  );

}


/* =========================================================
   COUNTDOWN + MUSIC
   The song starts at 0.000s.
   The quote drops at exactly 3.000s, in sync with the
   song's drop.
========================================================= */

function startCountdownAndDrop(){

  /*
   * PROPORTIONAL TIMELINE
   *
   * Every timestamp below is a FRACTION of DROP_OFFSET_MS, so the
   * entire intro scales together. Changing the offset (via the
   * timing debugger slider) stretches or compresses the whole
   * sequence without causing effects to overlap and without
   * leaving dead gaps.
   *
   * Anchor layout (fraction of DROP_OFFSET_MS):
   *   0.00  opening hit + "3"
   *   0.11  "2"
   *   0.22  "1"
   *   0.33  "GO"  + buildup mode on
   *   0.43  Logo hit
   *   0.48  chaos build-up loop starts
   *   0.97  pre-drop warning (hide logo, final flash)
   *   1.00  QUOTE DROP
   *
   * Music starts at 0.00 so the song's drop (at +3.0s in the audio)
   * lands as close to fraction 1.00 as the latency budget allows.
   */

  const T = DROP_OFFSET_MS;

  const T_OPEN      = 0;
  const T_2         = Math.round(T * 0.11);
  const T_1         = Math.round(T * 0.22);
  const T_GO        = Math.round(T * 0.33);
  const T_LOGO      = Math.round(T * 0.43);
  const T_BUILDUP_0 = Math.round(T * 0.48);
  const T_BUILDUP_1 = Math.round(T * 0.95);
  const T_PREDROP   = Math.round(T * 0.97);
  const T_DROP      = T;

  /*
   * Number of chaos beats across the build-up window, scaled to
   * the offset so the rhythm feels the same regardless of length.
   * At T=5000ms this gives ~7 beats (step ~360ms).
   */

  const buildupStep =
    Math.max(
      180,
      Math.round(T * 0.072)
    );

  startMusic();


  /* ---------------------------------------------------------
     0.00 — Big opening hit + "3"
  --------------------------------------------------------- */

  hitFlash();

  hitShake();

  sweepFlares();

  showNum(3);


  /* ---------------------------------------------------------
     "2"
  --------------------------------------------------------- */

  addTimer(
    function(){

      showNum(2);

    },
    T_2
  );


  /* ---------------------------------------------------------
     "1"
  --------------------------------------------------------- */

  addTimer(
    function(){

      showNum(1);

    },
    T_1
  );


  /* ---------------------------------------------------------
     "GO" + buildup mode on
  --------------------------------------------------------- */

  addTimer(
    function(){

      countdownEl?.classList.remove(
        "pop"
      );

      if(countdownEl){

        countdownEl.textContent =
          "";

      }

      showGo();

      overlay?.classList.add(
        "buildup"
      );

    },
    T_GO
  );


  /* ---------------------------------------------------------
     Logo hit
  --------------------------------------------------------- */

  addTimer(
    function(){

      goEl?.classList.remove(
        "pop"
      );

      hitFlash();

      hitShake();

      sweepFlares();

      spawnParticles(
        80,
        [
          "#FFD700",
          "#00F0FF",
          "#FF00C8",
          "#8B00FF",
          "#3DD1FF",
          "#FFFFFF"
        ]
      );

      logoEl?.classList.add(
        "show"
      );

      taglineEl?.classList.add(
        "show"
      );

    },
    T_LOGO
  );


  /* ---------------------------------------------------------
     CHAOS BUILD-UP LOOP
     Runs from T_BUILDUP_0 to T_BUILDUP_1, every buildupStep ms.
     Nothing else is scheduled in this window — this IS the
     build-up phase. Beats are spaced by a fraction of T so
     the rhythm scales with the offset.
  --------------------------------------------------------- */

  for(
    let t = T_BUILDUP_0;
    t < T_BUILDUP_1;
    t += buildupStep
  ){

    addTimer(
      function(){

        hitFlash();

        hitShake();

        hitGlitch();

        flashChaosBg();

        sweepFlares();

        showBuildupText();

        spawnParticles(
          25,
          [
            "#FFD700",
            "#FF00C8",
            "#00F0FF",
            "#FFFFFF",
            "#FF1E1E",
            "#B6FF1A"
          ]
        );

        beep(
          200 +
          Math.random() * 1000,

          100 +
          Math.random() * 400,

          .08,

          "square",

          .12
        );

      },
      t
    );

  }


  /* ---------------------------------------------------------
     PRE-DROP WARNING
     Hide the logo, fire one last flash + glitch + sawtooth
     sweep. Sits between the last build-up beat and the drop.
  --------------------------------------------------------- */

  addTimer(
    function(){

      logoEl?.classList.remove(
        "show"
      );

      taglineEl?.classList.remove(
        "show"
      );

      goEl?.classList.remove(
        "pop"
      );

      hitFlash();

      hitShake();

      hitGlitch();

      beep(
        600,
        1200,
        .4,
        "sawtooth",
        .3
      );

    },
    T_PREDROP
  );


  /* ---------------------------------------------------------
     QUOTE DROP
     Synced with the song's drop (with latency budget).
     buildup mode turns off so the burst background returns
     to its normal spin speed.
  --------------------------------------------------------- */

  addTimer(
    function(){

      overlay?.classList.remove(
        "buildup"
      );

      showQuote();

    },
    T_DROP
  );

}


/* =========================================================
   EVENTS
========================================================= */

btn?.addEventListener(
  "click",
  function(event){

    event.stopPropagation();

    playIntro();

  }
);


/*
 * Clicking the sponsor itself should NOT close
 * the entire cinematic overlay.
 */

sponsorOverlay?.addEventListener(
  "click",
  function(event){

    event.stopPropagation();

  }
);


overlay?.addEventListener(
  "click",
  function(event){

    if(
      sponsorActive
    ){

      return;

    }

    closeOverlay();

  }
);


overlay?.addEventListener(
  "keydown",
  function(event){

    if(
      event.key === "Enter" ||
      event.key === " " ||
      event.key === "Escape"
    ){

      event.preventDefault();

      closeOverlay();

    }

  }
);


/* =========================================================
   ESCAPE KEY
========================================================= */

document.addEventListener(
  "keydown",
  function(event){

    if(
      event.key === "Escape" &&
      overlay?.classList.contains(
        "active"
      )
    ){

      closeOverlay();

    }

  }
);


/* =========================================================
   HIDDEN YOUTUBE PLAYER
========================================================= */

function createHiddenYouTubeContainer(){

  if(
    document.getElementById(
      "youtubePlayer"
    )
  ){

    return;

  }

  const youtubeContainer =
    document.createElement(
      "div"
    );

  youtubeContainer.id =
    "youtubePlayer";

  youtubeContainer.style.position =
    "fixed";

  youtubeContainer.style.width =
    "1px";

  youtubeContainer.style.height =
    "1px";

  youtubeContainer.style.left =
    "-100px";

  youtubeContainer.style.top =
    "-100px";

  youtubeContainer.style.opacity =
    "0";

  youtubeContainer.style.pointerEvents =
    "none";

  youtubeContainer.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.appendChild(
    youtubeContainer
  );

}


createHiddenYouTubeContainer();


/* =========================================================
   START YOUTUBE API
========================================================= */

loadYouTubeAPI();


/* =========================================================
   DEBUG INFO
========================================================= */

console.log(
  "%cQUOTE-O-TRON 9000%c ONLINE",
  "color:#FF00C8;font-weight:bold;font-size:18px;",
  "color:#00F0FF;font-weight:bold;"
);

console.log(
  "Music → 0.000s"
);

console.log(
  "Quote drop → DROP_OFFSET_MS = " +
  DROP_OFFSET_MS +
  "ms (adjust via timing debugger slider)"
);


/* =========================================================
   ACHIEVEMENTS MENU
========================================================= */

(function setupAchievementsMenu(){

  const badge =
    document.getElementById(
      "achievementsBadge"
    );

  const menu =
    document.getElementById(
      "achievementsMenu"
    );

  const closeBtn =
    document.getElementById(
      "achievementsClose"
    );

  if(
    !badge ||
    !menu
  ){

    return;

  }

  function openMenu(){

    renderAchievementsMenu();

    menu.classList.add(
      "active"
    );

    menu.setAttribute(
      "aria-hidden",
      "false"
    );

  }

  function closeMenu(){

    menu.classList.remove(
      "active"
    );

    menu.setAttribute(
      "aria-hidden",
      "true"
    );

  }

  badge.addEventListener(
    "click",
    function(event){

      event.stopPropagation();

      openMenu();

    }
  );

  closeBtn?.addEventListener(
    "click",
    function(event){

      event.stopPropagation();

      closeMenu();

    }
  );

  /*
   * Click on backdrop closes menu
   */

  menu.addEventListener(
    "click",
    function(event){

      if(
        event.target === menu
      ){

        closeMenu();

      }

    }
  );

  /*
   * Escape closes menu
   */

  document.addEventListener(
    "keydown",
    function(event){

      if(
        event.key === "Escape" &&
        menu.classList.contains(
          "active"
        )
      ){

        closeMenu();

      }

    }
  );

  /*
   * Initial badge render
   */

  renderAchievementsBadge();

})();


/* =========================================================
   MESSAGE OVERLAY
========================================================= */

(function setupMessageOverlay(){

  const messageBtn =
    document.getElementById(
      "messageBtn"
    );

  const messageOverlay =
    document.getElementById(
      "messageOverlay"
    );

  const messageClose =
    document.getElementById(
      "messageClose"
    );

  if(
    !messageBtn ||
    !messageOverlay
  ){

    return;

  }

  function openMessage(){

    messageOverlay.classList.add(
      "active"
    );

    messageOverlay.setAttribute(
      "aria-hidden",
      "false"
    );

    /*
     * Mark the message as read for the "Heartfelt" achievement.
     * Only unlock the first time.
     */

    if(!messageRead){

      messageRead = true;

      saveAchievementState();

      setTimeout(
        function(){

          unlockAchievement(
            "read-message"
          );

        },
        1500
      );

    }

  }

  function closeMessage(){

    messageOverlay.classList.remove(
      "active"
    );

    messageOverlay.setAttribute(
      "aria-hidden",
      "true"
    );

  }

  messageBtn.addEventListener(
    "click",
    function(event){

      event.stopPropagation();

      openMessage();

    }
  );

  messageClose?.addEventListener(
    "click",
    function(event){

      event.stopPropagation();

      closeMessage();

    }
  );

  /*
   * Click on the backdrop (outside the card) closes the overlay.
   * Clicks inside the card are stopped so they don't bubble.
   */

  const card =
    messageOverlay.querySelector(
      ".message-card"
    );

  card?.addEventListener(
    "click",
    function(event){

      event.stopPropagation();

    }
  );

  messageOverlay.addEventListener(
    "click",
    function(event){

      closeMessage();

    }
  );

  /*
   * Escape key closes the message overlay (only if the
   * intro overlay isn't active — the intro has its own
   * escape handler).
   */

  document.addEventListener(
    "keydown",
    function(event){

      if(
        event.key === "Escape" &&
        messageOverlay.classList.contains(
          "active"
        )
      ){

        closeMessage();

      }

    }
  );

  console.log(
    "%c[QUOTE-O-TRON] Message overlay ready.",
    "color:#FFD700;font-weight:bold;"
  );

})();


/* =========================================================
   DEV SETTINGS TOGGLE
========================================================= */

(function setupDevSettings(){

  const devBtn =
    document.getElementById(
      "devSettingsBtn"
    );

  const debuggerEl =
    document.getElementById(
      "timingDebugger"
    );

  if(
    !devBtn ||
    !debuggerEl
  ){

    return;

  }

  /*
   * Persist the debugger visibility in localStorage so the
   * user's preference survives reloads. Default = hidden.
   */

  let debuggerVisible = false;

  try{

    debuggerVisible =
      localStorage.getItem(
        "quote-o-tron-debugger-visible"
      ) === "true";

  }catch(e){

    /* ignore */

  }

  function applyDebuggerVisibility(){

    if(debuggerVisible){

      debuggerEl.classList.remove(
        "hidden"
      );

      devBtn.classList.add(
        "active"
      );

      devBtn.textContent =
        "DEV ON";

    }else{

      debuggerEl.classList.add(
        "hidden"
      );

      devBtn.classList.remove(
        "active"
      );

      devBtn.textContent =
        "DEV";

    }

  }

  applyDebuggerVisibility();

  devBtn.addEventListener(
    "click",
    function(event){

      event.stopPropagation();

      debuggerVisible =
        !debuggerVisible;

      try{

        localStorage.setItem(
          "quote-o-tron-debugger-visible",
          String(debuggerVisible)
        );

      }catch(e){

        /* ignore */

      }

      applyDebuggerVisibility();

    }
  );

  console.log(
    "%c[QUOTE-O-TRON] Dev settings button ready. Click DEV (top-right) to toggle the timing debugger.",
    "color:#FFD700;font-weight:bold;"
  );

})();


/* =========================================================
   QUOTE COUNTER
   Tracks how many quotes have been unleashed and shows
   the count on the start page. Persists in localStorage.
========================================================= */

(function setupQuoteCounter(){

  const counterEl =
    document.getElementById(
      "quoteCounter"
    );

  if(!counterEl){
    return;
  }

  let count = 0;

  try{

    const saved =
      localStorage.getItem(
        "quote-o-tron-quote-count"
      );

    if(
      saved !== null &&
      !isNaN(Number(saved))
    ){

      count =
        Number(saved);

    }

  }catch(e){

    /* ignore */

  }

  function render(){

    counterEl.textContent =
      count +
      (count === 1 ? " QUOTE UNLEASHED" : " QUOTES UNLEASHED");

  }

  render();

  /*
   * Listen for showQuote() calls by hooking the quote reveal
   * element's class changes. When .show or .settle is added,
   * a quote was just revealed.
   */

  const quoteWrap =
    document.getElementById(
      "quoteReveal"
    );

  if(quoteWrap){

    let alreadyCounted = false;

    const observer =
      new MutationObserver(
        function(){

          if(
            quoteWrap.classList.contains(
              "show"
            ) &&
            !alreadyCounted
          ){

            alreadyCounted = true;

            count++;

            try{

              localStorage.setItem(
                "quote-o-tron-quote-count",
                String(count)
              );

            }catch(e){

              /* ignore */

            }

            render();

          }else if(
            !quoteWrap.classList.contains(
              "show"
            ) &&
            !quoteWrap.classList.contains(
              "settle"
            )
          ){

            alreadyCounted = false;

          }

        }
      );

    observer.observe(
      quoteWrap,
      {
        attributes:true,
        attributeFilter:[
          "class"
        ]
      }
    );

  }

})();


/* =========================================================
   TIMING DEBUGGER UI WIRING
========================================================= */

(function setupTimingDebugger(){

  const debuggerEl =
    document.getElementById(
      "timingDebugger"
    );

  const slider =
    document.getElementById(
      "tdOffset"
    );

  const valueEl =
    document.getElementById(
      "tdValue"
    );

  const hideBtn =
    document.getElementById(
      "tdHide"
    );

  const copyBtn =
    document.getElementById(
      "tdCopy"
    );

  if(
    !debuggerEl ||
    !slider ||
    !valueEl
  ){

    return;

  }

  /*
   * The slider range is -1500 to 2500, but DROP_OFFSET_MS is
   * usually in the 4000-6000 range. We use a baseline of 4000,
   * so slider value 1000 = DROP_OFFSET_MS 5000.
   */

  const SLIDER_BASELINE = 4000;

  function syncSliderToOffset(){

    const sliderVal =
      DROP_OFFSET_MS - SLIDER_BASELINE;

    slider.value =
      String(sliderVal);

    valueEl.textContent =
      DROP_OFFSET_MS + "ms";

  }

  syncSliderToOffset();

  slider.addEventListener(
    "input",
    function(){

      DROP_OFFSET_MS =
        SLIDER_BASELINE +
        Number(slider.value);

      valueEl.textContent =
        DROP_OFFSET_MS + "ms";

      try{

        localStorage.setItem(
          "quote-o-tron-drop-offset",
          String(DROP_OFFSET_MS)
        );

      }catch(e){

        /* ignore */

      }

    }
  );

  /*
   * Keep the debugger on top of the intro overlay by toggling
   * a class whenever the overlay opens/closes.
   */

  const overlayEl =
    document.getElementById(
      "introOverlay"
    );

  if(overlayEl){

    const observer =
      new MutationObserver(
        function(){

          if(
            overlayEl.classList.contains(
              "active"
            )
          ){

            debuggerEl.classList.add(
              "on-top"
            );

          }else{

            debuggerEl.classList.remove(
              "on-top"
            );

          }

        }
      );

    observer.observe(
      overlayEl,
      {
        attributes:true,
        attributeFilter:[
          "class"
        ]
      }
    );

  }

  hideBtn?.addEventListener(
    "click",
    function(){

      debuggerEl.classList.add(
        "hidden"
      );

    }
  );

  copyBtn?.addEventListener(
    "click",
    function(){

      const text =
        "DROP_OFFSET_MS = " +
        DROP_OFFSET_MS +
        ";";

      try{

        navigator.clipboard.writeText(
          text
        );

      }catch(e){

        /* clipboard might be blocked */

      }

      copyBtn.textContent =
        "COPIED: " + text;

      console.log(
        "%c[QUOTE-O-TRON DEBUG] Final value copied: " + text,
        "color:#B6FF1A;font-weight:bold;font-size:14px;"
      );

      setTimeout(
        function(){

          copyBtn.textContent =
            "COPY FINAL VALUE";

        },
        3000
      );

    }
  );

  console.log(
    "%c[QUOTE-O-TRON DEBUG] Timing debugger ready. " +
    "DROP_OFFSET_MS = " + DROP_OFFSET_MS + "ms. " +
    "Adjust the slider in the bottom-left to sync the drop.",
    "color:#00F0FF;font-weight:bold;"
  );

})();






