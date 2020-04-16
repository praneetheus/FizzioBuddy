// Global variables && constants 
const posenet = require('@tensorflow-models/posenet');
let Peer = require('simple-peer'); 
let socket = io()
const video = document.querySelector('video')
const poseNetButton = document.querySelector('#poseNetButton')
const disablePosenetButton = document.querySelector('#disablePosenet')
let client = {}
let disablePosenet = false; 
let pi = Math.PI;
let resNetRunning = false;
let MobileNetRunning = false; 

// getting start & stop buttons
const shoulderStartBtn = document.querySelector('#shoulder_start')
const shoulderStopBtn = document.querySelector('#shoulder_stop')

const elbowStartBtn = document.querySelector('#elbow_start')
const elbowStopBtn = document.querySelector('#elbow_stop')

const cervicalStartBtn = document.querySelector('#cervical_start')
const cervicalStopBtn = document.querySelector('#cervical_stop')

// getting start & stop end

// getting range of motion value from span text fields
// for neck
let neckStartVal;
cervicalStartBtn.addEventListener('click', () => {
  neckStartVal = document.getElementById('cervical').innerHTML;
})

cervicalStopBtn.addEventListener('click', () => {
  let neckStoptVal = document.getElementById('cervical').innerHTML;
  console.log(Math.abs(neckStartVal - neckStoptVal));
})

// for shoulder
let shoulderStartVal;
shoulderStartBtn.addEventListener('click', () => {
  shoulderStartVal = document.getElementById('shoulder').innerHTML;
})

shoulderStopBtn.addEventListener('click', () => {
  let shoulderStoptVal = document.getElementById('shoulder').innerHTML;
  console.log(Math.abs(shoulderStartVal - shoulderStoptVal));
})

// for elbow
let elbowStartVal;
elbowStartBtn.addEventListener('click', () => {
  elbowStartVal = document.getElementById('elbow').innerHTML;
})

elbowStopBtn.addEventListener('click', () => {
  let elbowStoptVal = document.getElementById('elbow').innerHTML;
  console.log(Math.abs(elbowStartVal - elbowStoptVal));
})

// end getting span text fields

let net;
let color = 'red';

const pnet = {
    algorithm: 'single-pose',
    input: {
      architecture: 'MobileNetV1',
      // architecture: 'ResNet50',
      outputStride: 16,
      inputResolution: 257,
      multiplier: 1.0,
      quantBytes: 2
    },
    singlePoseDetection: {
      minPoseConfidence: 0.1,
      minPartConfidence: 0.5,
    },
    output: {
      showVideo: true,
      showSkeleton: true,
      showPoints: true,
      showBoundingBox: false,
    },
    net: null,
  };

  function detectPoseInRealTime(vid, net) {
    const canvas = document.getElementById('peerOutput');
    const vi = document.getElementById('peerVideo');
    // document.getElementById("pee").style.color = "blue";
    vi.style.display = "none";
    const ctx = canvas.getContext('2d');
    const videoWidth = vi.videoWidth;
    const videoHeight = vi.videoHeight;
    vi.width = videoWidth;
    vi.height = videoHeight;

    const flipPoseHorizontal = true;
  
    canvas.width = videoWidth;
    canvas.height = videoHeight;

    // if (disablePosenet && pnet.net == null) {
    //   // ctx.clearRect(0, 0, videoWidth, videoHeight);

    //   ctx.save();
    //   ctx.scale(-1, 1);
    //   ctx.translate(-videoWidth, 0);
    //   ctx.drawImage(vid, 0, 0, videoWidth, videoHeight);
    //   ctx.restore();
    // }
    
    if (!disablePosenet) {
      async function poseDetectionFrame() {
        let poses = [];
        let minPoseConfidence;
        let minPartConfidence;
    
        switch (pnet.algorithm) {
          case 'single-pose':
            if (pnet.net == null) {
              break;
            }
            const pose = await pnet.net.estimatePoses(vid, {
              flipHorizontal: flipPoseHorizontal,
              decodingMethod: 'single-person'
            });
    
            poses = poses.concat(pose);
            // console.log(poses);
            minPoseConfidence = +pnet.singlePoseDetection.minPoseConfidence;
            minPartConfidence = +pnet.singlePoseDetection.minPartConfidence;
            break;
        }
        ctx.clearRect(0, 0, videoWidth, videoHeight);
        // ctx.drawImage(vid, 0, 0, videoWidth, videoHeight);
        // ctx.restore();
        if (pnet.output.showVideo) {
          ctx.save();
          ctx.scale(-1, 1);
          ctx.translate(-videoWidth, 0);
          ctx.drawImage(vid, 0, 0, videoWidth, videoHeight);
          ctx.restore();
        }
  
        // needed to calculate angles
        // https://stackoverflow.com/questions/34151834/javascript-array-contains-includes-sub-array
        function hasSubArray(master, sub) {
          return sub.every((i => v => i = master.indexOf(v, i) + 1)(0));
        }
    
        function drawKeypoints(keypoints, minConfidence, ctx, scale = 1) {
            // console.log("inside draw keypoint");
            let parts = [];
            let reqPartList = [];
            let elbowAngle;
            // these have to be in order
            let elbowAngleReq = ['rightShoulder', 'rightElbow', 'rightWrist'];
            let shoulderAngle;
            let shoulderAngleReq = ['rightShoulder', 'rightElbow', 'rightHip'];
            let cervicalAngel;
            let cervicalAngelReq = ['nose', 'leftShoulder', 'rightShoulder'];
            for (let i = 0; i < keypoints.length; i++) {
                const keypoint = keypoints[i];
                if (keypoint.score < minConfidence) {
                  // console.log(keypoint.part);
                  reqPartList = reqPartList.filter(item => item !== keypoint.part);
                  parts = parts.filter(item => item.part !== keypoint.part);
                  continue;
                }
                const {y, x} = keypoint.position;
                parts.push({part: keypoint.part, x: x, y: y});
                reqPartList.push(keypoint.part);
                // console.log(reqPartList);
  
                if (hasSubArray(reqPartList, elbowAngleReq)) {
                  // console.log("i am running")
                  let p0index = parts.findIndex(p => p.part == "rightShoulder")
                  let centerIndex = parts.findIndex(p => p.part == "rightElbow")
                  let p1index = parts.findIndex(p => p.part == "rightWrist")
                  elbowAngle = calculateAngle(parts[p0index], parts[centerIndex], parts[p1index]);
                  elbowAngle = elbowAngle * (180/pi) 
                  document.getElementById("elbow").innerHTML = Math.round(elbowAngle*100)/100;
                  // console.log(elbowAngle);
                  // console.log(calculateAngle(parts[p0index], parts[p1index], parts[centerIndex]));
                }
  
                if (hasSubArray(reqPartList, cervicalAngelReq)) {
                  let p0index = parts.findIndex(p => p.part == "leftShoulder")
                  let centerIndex = parts.findIndex(p => p.part == "nose")
                  let p1index = parts.findIndex(p => p.part == "rightShoulder")
                  cervicalAngel = calculateAngle(parts[p0index], parts[centerIndex], parts[p1index]);
                  cervicalAngel = cervicalAngel * (180/pi) 
                  document.getElementById("cervical").innerHTML = Math.round(cervicalAngel*100)/100;
                  // console.log(cervicalAngel);
                }
  
                if (hasSubArray(reqPartList, shoulderAngleReq)) {
                  let p0index = parts.findIndex(p => p.part == "rightElbow")
                  let centerIndex = parts.findIndex(p => p.part == "rightShoulder")
                  let p1index = parts.findIndex(p => p.part == "rightHip")
                  shoulderAngle = calculateAngle(parts[p0index], parts[centerIndex], parts[p1index]);
                  shoulderAngle = shoulderAngle * (180/pi) 
                  document.getElementById("shoulder").innerHTML = Math.round(shoulderAngle*100)/100;
                  // console.log(shoulderAngle);
                }
  
                // console.log(parts); 
                // console.log(ctx);
                drawPoint(ctx, y * scale, x * scale, 3, color, keypoint.part);
              }
        }
        function drawPoint(ctx, y, x, r, color, part) {
            // console.log(x, y)
            ctx.beginPath();
            ctx.arc(x, y, r, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
            // ctx.textAlign = "start";
            ctx.fillText(part, x, y);
        }
  
        poses.forEach(({score, keypoints}) => {
          if (score >= minPoseConfidence) {
            if (pnet.output.showPoints) {
              drawKeypoints(keypoints, minPartConfidence, ctx);
            }
          }
        });
        requestAnimationFrame(poseDetectionFrame);
      }
      poseDetectionFrame();
    }
  
  }

  async function loadPoseNet(vid) {
    //   vid = returnPeerVideo();
    pnet.net = await posenet.load({
      architecture: pnet.input.architecture,
      outputStride: pnet.input.outputStride,
      inputResolution: pnet.input.inputResolution,
      multiplier: pnet.input.multiplier,
      quantBytes: pnet.input.quantBytes
    });
    
    detectPoseInRealTime(vid, net);
  }

  async function loadResNet(vid) {
    pnet.net = await posenet.load({
      architecture: 'ResNet50',
      outputStride: 16,
      inputResolution: 257,
      multiplier: null,
      quantBytes: 2
    });
    detectPoseInRealTime(vid, net);
  }
//   end posenet

// calculate angle
// https://stackoverflow.com/questions/1211212/how-to-calculate-an-angle-from-three-points
function calculateAngle(p0,p1,p2) {
  var b = Math.pow(p1.x-p0.x,2) + Math.pow(p1.y-p0.y,2),
      a = Math.pow(p1.x-p2.x,2) + Math.pow(p1.y-p2.y,2),
      c = Math.pow(p2.x-p0.x,2) + Math.pow(p2.y-p0.y,2);
  return Math.acos( (a+b-c) / Math.sqrt(4*a*b) );
}

//get stream
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        socket.emit('NewClient')
        video.srcObject = stream
        video.play()

        //used to initialize a peer
        function InitPeer(type) {
            let peer = new Peer({ initiator: (type == 'init') ? true : false, 
            stream: stream, 
            trickle: false })
            peer.on('stream', function (stream) {
                CreateVideo(stream)
            })
            return peer
        }
      
        resNetButton.addEventListener('click', () => {
          console.log("Setting up resNet");
          if (!MobileNetRunning) {
            disablePosenet = false;
            resNetRunning = true; 
            const vivi = returnPeerVideo();

            // loads reznet
            loadResNet(vivi)

          } else {
            console.log("Error: MobileNet is already running")
          }
        })

        poseNetButton.addEventListener('click', () => {
          console.log('Setting up MobileNet');
          if (!resNetRunning) {
            MobileNetRunning = true; 
            disablePosenet = false;
            
            const vivi = returnPeerVideo();
            loadPoseNet(vivi)
          } else {
            console.log("Error: ResNet is already running")
          }
        })

        disablePosenetButton.addEventListener('click', () => {
          disablePosenet = true;
          pnet.net = null;  
          if (resNetRunning) {
            resNetRunning = false;
          }
          if (MobileNetRunning) {
            MobileNetRunning = false; 
          }
        })

        function returnPeerVideo() {
            let video = document.getElementById('peerVideo');
            // video.play();
            return video;
          }

        //for peer of type init
        function MakePeer() {
            client.gotAnswer = false
            let peer = InitPeer('init')
            peer.on('signal', function (data) {
                if (!client.gotAnswer) {
                    socket.emit('Offer', data)
                }
            })
            client.peer = peer
        }

        //for peer of type not init
        function FrontAnswer(offer) {
            let peer = InitPeer('notInit')
            peer.on('signal', (data) => {
                socket.emit('Answer', data)
            })
            peer.signal(offer)
            client.peer = peer
        }

        function SignalAnswer(answer) {
            client.gotAnswer = true
            let peer = client.peer
            peer.signal(answer)
        }

        function CreateVideo(stream) {
            let video = document.getElementById('peerVideo')
            video.srcObject = stream
            video.play()
        }

        function SessionActive() {
            document.write('Session Active. Please come back later')
            // can add queueing here...
        }

        function RemovePeer() {
            document.getElementById("peerVideo").remove();
            document.getElementById("peerOutput").remove();
            if (client.peer) {
                client.peer.destroy()
            }
        }
        
        socket.on('CreatePeer', MakePeer)
        socket.on('SessionActive', SessionActive)
        socket.on('BackOffer', FrontAnswer)
        socket.on('BackAnswer', SignalAnswer)
        socket.on('Disconnect', RemovePeer)

    })
    .catch(err => document.write(err))

