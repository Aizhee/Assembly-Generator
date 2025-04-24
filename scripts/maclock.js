(function() {
    const MASTER_SECRET = "0x8A6F2D";
    const STORAGE_KEY = "8086_access";
    
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
      if(!validateAccess()) {
        const clientMAC = getClientMAC();
        document.body.innerHTML = `
          <div id="lockScreen" style="text-align:center;padding:50px;font-family:Arial;">
            <h2>🔒 Access Locked</h2>
            <p>Your Device ID: <code>${clientMAC}</code></p>
            <p>Contact the master with this ID to get access key</p>
            <input type="text" id="accessKey" placeholder="Enter access key" 
              style="padding:8px;margin:10px;width:200px;">
            <button onclick="attemptUnlock()" 
              style="padding:8px 15px;background:#0c7823;color:white;border:none;">
              Unlock
            </button>
          </div>
        `;
        
        window.attemptUnlock = function() {
          const inputKey = document.getElementById('accessKey').value;
          const calculatedHash = generateHash(clientMAC);
          
          if(inputKey === calculatedHash) {
            localStorage.setItem(STORAGE_KEY, `${clientMAC}|${calculatedHash}`);
            location.reload();
          } else {
            alert("❌ Invalid access key");
          }
        };
      } else {
        document.getElementById('mainContent').style.visibility = 'visible';
        // Load main script after unlocking
        const script = document.createElement('script');
        script.src = "scripts/int10h.js";
        document.body.appendChild(script);
      }
    });
  })();