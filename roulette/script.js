// ----------- refs DOM -----------
const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const ball = document.getElementById('roulette-ball');

const result = document.getElementById('result');
const winText = document.getElementById('win');
const spinBtn = document.getElementById('spin-btn');
const numberInput = document.getElementById('specific-number');
const betButtons = document.querySelectorAll('.bet');

const saldoEl = document.getElementById('saldo');     // kalau ada
const tickSound = document.getElementById('tick-sound');

const TWO_PI = Math.PI * 2;

// ----------- state -----------
let selectedBet = null;
let saldo = typeof saldoEl !== 'undefined' && saldoEl ? 1000 : 0;
const betAmount = 100;

let spinning = false;

// ----------- data angka & warna (urutan Roulette Eropa) -----------
const numbers = [
  {num:0,color:'green'}, {num:32,color:'red'}, {num:15,color:'black'},
  {num:19,color:'red'}, {num:4,color:'black'}, {num:21,color:'red'},
  {num:2,color:'black'}, {num:25,color:'red'}, {num:17,color:'black'},
  {num:34,color:'red'}, {num:6,color:'black'}, {num:27,color:'red'},
  {num:13,color:'black'}, {num:36,color:'red'}, {num:11,color:'black'},
  {num:30,color:'red'}, {num:8,color:'black'}, {num:23,color:'red'},
  {num:10,color:'black'}, {num:5,color:'red'}, {num:24,color:'black'},
  {num:16,color:'red'}, {num:33,color:'black'}, {num:1,color:'red'},
  {num:20,color:'black'}, {num:14,color:'red'}, {num:31,color:'black'},
  {num:9,color:'red'}, {num:22,color:'black'}, {num:18,color:'red'},
  {num:29,color:'black'}, {num:7,color:'red'}, {num:28,color:'black'},
  {num:12,color:'red'}, {num:35,color:'black'}, {num:3,color:'red'},
  {num:26,color:'black'}
];

const sliceAngle = TWO_PI / numbers.length;

// ----------- gambar roda (rotasi = sudut roda terhadap dunia) -----------
function drawWheel(rotation = 0){
  const R = canvas.width / 2;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  numbers.forEach((n, i) => {
    const start = i * sliceAngle + rotation;
    // slice
    ctx.beginPath();
    ctx.moveTo(R, R);
    ctx.arc(R, R, R, start, start + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = n.color;
    ctx.fill();

    // nomor
    ctx.save();
    ctx.translate(R, R);
    ctx.rotate(start + sliceAngle / 2);
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff";
    ctx.font = "bold 14px Poppins, sans-serif";
    ctx.fillText(n.num, R - 12, 0);
    ctx.restore();
  });

  // ring tengah (sedikit kosmetik)
  ctx.beginPath();
  ctx.arc(R, R, R-6, 0, TWO_PI);
  ctx.lineWidth = 12;
  ctx.strokeStyle = "rgba(0,0,0,.55)";
  ctx.stroke();
}

// ----------- helpers -----------
function updateSaldo(){
  if(saldoEl) saldoEl.textContent = `Saldo: $${saldo}`;
}

// pilih taruhan
betButtons.forEach(btn=>{
  btn.addEventListener('click',()=>{
    selectedBet = { type: btn.dataset.type, value: btn.dataset.value };
  });
});

// ----------- SPIN -----------
// Atur di sini (ms)
const FADE_OUT_DURATION = 10; // 1.5 detik (bisa diganti 500, 2000, dst.)

spinBtn.addEventListener('click', ()=>{
  if(spinning) return;

  if(saldoEl){ // mode dengan saldo
    if(saldo < betAmount){ alert("Saldo tidak cukup!"); return; }
    saldo -= betAmount; updateSaldo();
  }

  const duration = 5200;                  // ms animasi spin
  const targetTurns = 3 + Math.random()*2; // 3–5 putaran roda
  const ballSpeedFactor = 2.6;            // bola lebih cepat

  let start = null;
  let fadeOutDone = false;

  spinning = true;

  // 🔊 Mainkan suara panjang sekali tiap spin
  if(tickSound){
    try {
      tickSound.currentTime = 0;
      tickSound.volume = 1;
      tickSound.play();
    } catch(e){}
  }

  function animate(ts){
    if(!start) start = ts;
    const elapsed = ts - start;
    const t = elapsed / duration;
    const eased = (t >= 1) ? 1 : (1 - Math.pow(1 - t, 3));

    const wheelAngle = eased * targetTurns * TWO_PI;
    const ballAngle  = wheelAngle * ballSpeedFactor;

    drawWheel(wheelAngle);

    // posisi bola
    const Rball = (canvas.width/2) - 40;
    const bx = canvas.width/2  + Math.cos(ballAngle) * Rball;
    const by = canvas.height/2 + Math.sin(ballAngle) * Rball;
    ball.style.transform = `translate(${bx - canvas.width/2}px, ${by - canvas.height/2}px)`;

    // sudut relatif bola terhadap roda
    const rel = ((ballAngle - wheelAngle) % TWO_PI + TWO_PI) % TWO_PI;
    const tickIndex = Math.floor(rel / sliceAngle) % numbers.length;

    if(t < 1){
      requestAnimationFrame(animate);
    }else{
      const landedNumber = numbers[tickIndex].num;
      result.textContent = `Hasil: ${landedNumber}`;

      let win = false;
      if(selectedBet){
        if(selectedBet.type === 'color' && numbers[tickIndex].color === selectedBet.value) win = true;
      }
      if(numberInput && numberInput.value && parseInt(numberInput.value,10) === landedNumber) win = true;

      if(win){
        if(saldoEl) saldo += betAmount * 2;
        winText.textContent = "🎉 GACORR MANG";
      }else{
        winText.textContent = "😹 AWOKAWOK BELEGUG PISAN SIA TEH GOBLOGG";
      }
      updateSaldo();
      spinning = false;

      // 🔊 Fade out dinamis
      if(tickSound && !fadeOutDone){
        fadeOutDone = true;
        const fadeSteps = 30; // makin besar makin halus
        const fadeInterval = FADE_OUT_DURATION / fadeSteps;
        let step = 0;
        const fade = setInterval(()=>{
          step++;
          tickSound.volume = Math.max(0, 1 - step/fadeSteps);
          if(step >= fadeSteps){
            clearInterval(fade);
            tickSound.pause();
            tickSound.currentTime = 0;
            tickSound.volume = 1;
          }
        }, fadeInterval);
      }
    }
  }

  requestAnimationFrame(animate);
});



// gambar awal
drawWheel();
updateSaldo();

const backBtn = document.getElementById("backBtn");
const popupOverlay = document.getElementById("popupOverlay");
const confirmYes = document.getElementById("confirmYes");
const confirmNo = document.getElementById("confirmNo");

// Saat klik Back → tampil popup
backBtn.addEventListener("click", () => {
  popupOverlay.style.display = "flex";
});

// Klik YA → ke homepage
confirmYes.addEventListener("click", () => {
  window.location.href = "../index.html"; 
});

// Klik Lanjut Bermain → tutup popup
confirmNo.addEventListener("click", () => {
  popupOverlay.style.display = "none";
});
