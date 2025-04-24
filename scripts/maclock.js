(function() {
    const MASTER_SECRET = "0x8A6F2D";
    const STORAGE_KEY = "8086_access";
    let tungCounter = parseInt(localStorage.getItem('tungCounter')) || 0;
    
    function generateHash(mac) {
      let hash = 0;
      for(let i = 0; i < mac.length; i++) {
        hash = (hash << 5) - hash + mac.charCodeAt(i);
        hash |= 0;
      }
      return (hash ^ parseInt(MASTER_SECRET, 16)).toString(16);
    }

    function getClientMAC() {
      let mac = localStorage.getItem("client_mac");
      if(!mac) {
        mac = Array.from({length: 6}, () => 
          Math.floor(Math.random()*255).toString(16).padStart(2,'0')).join('-');
        localStorage.setItem("client_mac", mac);
      }
      return mac;
    }

    function validateAccess() {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if(!storedData) return false;
      const [mac, hash] = storedData.split('|');
      return hash === generateHash(mac);
    }

    document.addEventListener('DOMContentLoaded', function() {
        if (tungCounter > 0) {
            localStorage.setItem('tungCounter', 0);
            tungCounter = 0;
        }

      if(!validateAccess()) {
        const clientMAC = getClientMAC();
        document.body.innerHTML = `
          <div id="lockScreen" class ="text-vars" style="text-align:center;padding:50px;font-family:Arial;">
            <h2>🔒 Access Locked</h2>
            <img id="lockScreen_img" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTSCOEJpeaMjYICMEGYtIRBrbITcmxu3M-WMQ&s">
            <p>The content is restricted to a few people only.</p>
            <p>Your Device ID: <code>${clientMAC}</code></p>
            <p>Contact the master with this ID to get access key</p>
            <div class="text-input">
                <input type="text" class ="text-input" id="accessKey" placeholder="Enter access key" ">
            </div>
            <button onclick="attemptUnlock()" class="" style="margin:0px auto;">
              Unlock This Page
            </button>
          </div>
        `;
        
        window.attemptUnlock = function() {
          const inputKey = document.getElementById('accessKey').value;
          if (!inputKey) return;
          const calculatedHash = generateHash(clientMAC);
          
          if(inputKey === calculatedHash) {
            localStorage.setItem(STORAGE_KEY, `${clientMAC}|${calculatedHash}`);
            location.reload();
          } else {
            tungCounter++;
            localStorage.setItem('tungCounter', tungCounter);
            const audio = new Audio('https://static.wikia.nocookie.net/brainrotnew/images/c/c4/Tung_Tung_Tung_Sahur.mp3');
            
            document.getElementById('lockScreen_img').src = "data:image/jpeg;base64,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";
            const messagePara = document.querySelector('#lockScreen p:nth-of-type(1)');
            const originalWords = messagePara.textContent.split(' ');

            const modifiedWords = originalWords.map((word, index) => {
                if (index < tungCounter) {
                return index === originalWords.length - 1 ? 'sahur' : 'tung';
                }
                return word;
            });

            const img = new Image();
            img.src = "https://play-lh.googleusercontent.com/qBiLTYKuDA9aecK01rKoBYMp19lLOSq3xJvLkjTxlLCOJ_blR9ZPvBUblRaKFbDQ8P29";

            if (modifiedWords[modifiedWords.length - 1] === 'sahur') {
              const jumpscare = document.createElement('img');
              jumpscare.src = img.src;
              jumpscare.style.position = 'fixed';
              jumpscare.style.top = '0';
              jumpscare.style.left = '0';
              jumpscare.style.width = '100%';
              jumpscare.style.height = '100%';
              jumpscare.style.objectFit = 'cover';
              jumpscare.style.zIndex = '9999';
              document.body.appendChild(jumpscare);

                const screamAudio = new Audio('media/idk.mp3');
                //stop any other audio
                audio.pause();
                screamAudio.play();
              
              setTimeout(() => {
                document.body.removeChild(jumpscare);
              }, 3100);
            } else {
                audio.play();
            }

            messagePara.textContent = modifiedWords.join(' ');
            alert("❌ Invalid access key");
          }
        };
      } else {
        document.getElementById('mainContent').style.visibility = 'visible';
        const script = document.createElement('script');
        script.src = "scripts/int10h.js";
        document.body.appendChild(script);
      }
    });
  })();