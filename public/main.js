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
// const cervicalStartBtn = document.querySelector('#cervical_start')
// const cervicalStopBtn = document.querySelector('#cervical_stop')

// Shoulder 
const RshoulderStartBtn = document.querySelector('#Rshoulder_start')
const RshoulderStopBtn = document.querySelector('#Rshoulder_stop')

const LshoulderStartBtn = document.querySelector('#Lshoulder_start')
const LshoulderStopBtn = document.querySelector('#Lshoulder_stop')

// elbow
const RelbowStartBtn = document.querySelector('#Relbow_start')
const RelbowStopBtn = document.querySelector('#Relbow_stop')

const LelbowStartBtn = document.querySelector('#Lelbow_start')
const LelbowStopBtn = document.querySelector('#Lelbow_stop')

// hip
const RhipStartBtn = document.querySelector('#Rhip_start')
const RhipStopBtn = document.querySelector('#Rhip_stop')

const LhipStartBtn = document.querySelector('#Lhip_start')
const LhipStopBtn = document.querySelector('#Lhip_stop')

// knee
const RkneeStartBtn = document.querySelector('#Rknee_start')
const RkneeStopBtn = document.querySelector('#Rknee_stop')

const LkneeStartBtn = document.querySelector('#Lknee_start')
const LkneeStopBtn = document.querySelector('#Lknee_stop')

// getting start & stop end

// getting range of motion value from span text fields
// // for neck
// let neckStartVal;
// cervicalStartBtn.addEventListener('click', () => {
//   neckStartVal = document.getElementById('cervical').innerHTML;
// })

// cervicalStopBtn.addEventListener('click', () => {
//   let neckStoptVal = document.getElementById('cervical').innerHTML;
//   console.log(Math.abs(neckStartVal - neckStoptVal));
// })

// for shoulder
let RshoulderStartVal;
RshoulderStartBtn.addEventListener('click', () => {
  RshoulderStartVal = document.getElementById('Rshoulder').innerHTML;

})

RshoulderStopBtn.addEventListener('click', () => {
  let RshoulderStoptVal = document.getElementById('Rshoulder').innerHTML;
  document.getElementById("Rshoulder_out").innerHTML = Math.round(Math.abs(RshoulderStoptVal - RshoulderStartVal)*100)/100;
  // console.log(Math.abs(RshoulderStartVal - RshoulderStoptVal));
})

let LshoulderStartVal;
LshoulderStartBtn.addEventListener('click', () => {
  LshoulderStartVal = document.getElementById('Lshoulder').innerHTML;
})

LshoulderStopBtn.addEventListener('click', () => {
  let LshoulderStoptVal = document.getElementById('Lshoulder').innerHTML;
  document.getElementById("Lshoulder_out").innerHTML = Math.round(Math.abs(LshoulderStoptVal - LshoulderStartVal)*100)/100;
  // console.log(Math.abs(LshoulderStartVal - LshoulderStoptVal));
})

// for elbow
let RelbowStartVal;
RelbowStartBtn.addEventListener('click', () => {
  RelbowStartVal = document.getElementById('Relbow').innerHTML;
})

RelbowStopBtn.addEventListener('click', () => {
  let RelbowStoptVal = document.getElementById('Relbow').innerHTML;
  document.getElementById("Relbow_out").innerHTML = Math.round(Math.abs(RelbowStoptVal - RelbowStartVal)*100)/100;
  // console.log(Math.abs(RelbowStartVal - RelbowStoptVal));
})

let LelbowStartVal;
LelbowStartBtn.addEventListener('click', () => {
  LelbowStartVal = document.getElementById('Lelbow').innerHTML;
})

LelbowStopBtn.addEventListener('click', () => {
  let LelbowStoptVal = document.getElementById('Lelbow').innerHTML;
  document.getElementById("Lelbow_out").innerHTML = Math.round(Math.abs(LelbowStoptVal - LelbowStartVal)*100)/100;
  // console.log(Math.abs(LelbowStartVal - LelbowStoptVal));
})

// for hip
let RhipStartVal;
RhipStartBtn.addEventListener('click', () => {
  RhipStartVal = document.getElementById('Rhip').innerHTML;
})

RhipStopBtn.addEventListener('click', () => {
  let RhipStoptVal = document.getElementById('Rhip').innerHTML;
  document.getElementById("Rhip_out").innerHTML = Math.round(Math.abs(RhipStoptVal - RhipStartVal)*100)/100;
  // console.log(Math.abs(RhipStartVal - RhipStoptVal));
})

let LhipStartVal;
LhipStartBtn.addEventListener('click', () => {
  LhipStartVal = document.getElementById('Lhip').innerHTML;
})

LhipStopBtn.addEventListener('click', () => {
  let LhipStoptVal = document.getElementById('Lhip').innerHTML;
  document.getElementById("Lhip_out").innerHTML = Math.round(Math.abs(LhipStoptVal - LhipStartVal)*100)/100;
  // console.log(Math.abs(LhipStartVal - LhipStoptVal));
})

// for knee
let RkneeStartVal;
RkneeStartBtn.addEventListener('click', () => {
  RkneeStartVal = document.getElementById('Rknee').innerHTML;
})

RkneeStopBtn.addEventListener('click', () => {
  let RkneeStoptVal = document.getElementById('Rknee').innerHTML;
  document.getElementById("Rknee_out").innerHTML = Math.round(Math.abs(RkneeStoptVal - RkneeStartVal)*100)/100;
  // console.log(Math.abs(RkneeStartVal - RkneeStoptVal));
})

let LkneeStartVal;
LkneeStartBtn.addEventListener('click', () => {
  LkneeStartVal = document.getElementById('Lknee').innerHTML;
})

LkneeStopBtn.addEventListener('click', () => {
  let LkneeStoptVal = document.getElementById('Lknee').innerHTML;
  document.getElementById("Lknee_out").innerHTML = Math.round(Math.abs(LkneeStoptVal - LkneeStartVal)*100)/100;
  // console.log(Math.abs(LkneeStartVal - LkneeStoptVal));
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
  
  
  function detectPoseInRealTime(vid) {
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

    if (disablePosenet && pnet.net == null) {
      // ctx.clearRect(0, 0, videoWidth, videoHeight);
      // vi.play();

      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-videoWidth, 0);
      ctx.drawImage(vid, 0, 0, videoWidth, videoHeight);
      ctx.restore();
    }
    
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
            // let cervicalAngel;
            // let cervicalAngelReq = ['nose', 'leftShoulder', 'rightShoulder'];
            
            // these have to be in order
            let RshoulderAngle;
            let LshoulderAngle;
            let RshoulderAngleReq = ['rightShoulder', 'rightElbow', 'rightHip'];
            let LshoulderAngleReq = ['leftShoulder', 'leftElbow', 'leftHip'];

            let RelbowAngle;
            let LelbowAngle;
            let RelbowAngleReq = ['rightShoulder', 'rightElbow', 'rightWrist'];
            let LelbowAngleReq = ['leftShoulder', 'leftElbow', 'leftWrist'];

            let RhipAngle;
            let LhipAngle;
            let RhipAngleReq = ['rightShoulder', 'rightHip', 'rightKnee'];
            let LhipAngleReq = ['leftShoulder', 'leftHip', 'leftKnee'];

            let RkneeAngle;
            let LkneeAngle;
            let RkneeAngleReq = ['rightHip', 'rightKnee', 'rightAnkle'];
            let LkneeAngleReq = ['leftHip', 'leftKnee', 'leftAnkle'];


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

                // calculate shoulder angle
                if (hasSubArray(reqPartList, RshoulderAngleReq)) {
                  let p0index = parts.findIndex(p => p.part == "rightElbow")
                  let centerIndex = parts.findIndex(p => p.part == "rightShoulder")
                  let p1index = parts.findIndex(p => p.part == "rightHip")
                  RshoulderAngle = calculateAngle(parts[p0index], parts[centerIndex], parts[p1index]);
                  RshoulderAngle = RshoulderAngle * (180/pi) 
                  document.getElementById("Rshoulder").innerHTML = Math.round(RshoulderAngle*100)/100;
                }

                if (hasSubArray(reqPartList, LshoulderAngleReq)) {
                  let p0index = parts.findIndex(p => p.part == "leftElbow")
                  let centerIndex = parts.findIndex(p => p.part == "leftShoulder")
                  let p1index = parts.findIndex(p => p.part == "leftHip")
                  LshoulderAngle = calculateAngle(parts[p0index], parts[centerIndex], parts[p1index]);
                  LshoulderAngle = LshoulderAngle * (180/pi) 
                  document.getElementById("Lshoulder").innerHTML = Math.round(LshoulderAngle*100)/100;
                }
  
                // calculate elbow angles
                if (hasSubArray(reqPartList, RelbowAngleReq)) {
                  let p0index = parts.findIndex(p => p.part == "rightShoulder")
                  let centerIndex = parts.findIndex(p => p.part == "rightElbow")
                  let p1index = parts.findIndex(p => p.part == "rightWrist")
                  RelbowAngle = calculateAngle(parts[p0index], parts[centerIndex], parts[p1index]);
                  RelbowAngle = RelbowAngle * (180/pi) 
                  document.getElementById("Relbow").innerHTML = Math.round(RelbowAngle*100)/100;
                }

                if (hasSubArray(reqPartList, LelbowAngleReq)) {
                  let p0index = parts.findIndex(p => p.part == "leftShoulder")
                  let centerIndex = parts.findIndex(p => p.part == "leftElbow")
                  let p1index = parts.findIndex(p => p.part == "leftWrist")
                  LelbowAngle = calculateAngle(parts[p0index], parts[centerIndex], parts[p1index]);
                  LelbowAngle = LelbowAngle * (180/pi) 
                  document.getElementById("Lelbow").innerHTML = Math.round(LelbowAngle*100)/100;
                }

                // hip
                if (hasSubArray(reqPartList, RhipAngleReq)) {
                  let p0index = parts.findIndex(p => p.part == "rightShoulder")
                  let centerIndex = parts.findIndex(p => p.part == "rightHip")
                  let p1index = parts.findIndex(p => p.part == "rightKnee")
                  RhipAngle = calculateAngle(parts[p0index], parts[centerIndex], parts[p1index]);
                  RhipAngle = RhipAngle * (180/pi) 
                  document.getElementById("Rhip").innerHTML = Math.round(RhipAngle*100)/100;
                }

                if (hasSubArray(reqPartList, LhipAngleReq)) {
                  let p0index = parts.findIndex(p => p.part == "leftShoulder")
                  let centerIndex = parts.findIndex(p => p.part == "leftHip")
                  let p1index = parts.findIndex(p => p.part == "leftKnee")
                  LhipAngle = calculateAngle(parts[p0index], parts[centerIndex], parts[p1index]);
                  LhipAngle = LhipAngle * (180/pi) 
                  document.getElementById("Lhip").innerHTML = Math.round(LhipAngle*100)/100;
                }

                // for knee
                if (hasSubArray(reqPartList, RkneeAngleReq)) {
                  let p0index = parts.findIndex(p => p.part == "rightHip")
                  let centerIndex = parts.findIndex(p => p.part == "rightKnee")
                  let p1index = parts.findIndex(p => p.part == "rightAnkle")
                  RkneeAngle = calculateAngle(parts[p0index], parts[centerIndex], parts[p1index]);
                  RkneeAngle = RkneeAngle * (180/pi) 
                  document.getElementById("Rknee").innerHTML = Math.round(RkneeAngle*100)/100;
                }

                if (hasSubArray(reqPartList, LkneeAngleReq)) {
                  let p0index = parts.findIndex(p => p.part == "leftHip")
                  let centerIndex = parts.findIndex(p => p.part == "leftKnee")
                  let p1index = parts.findIndex(p => p.part == "leftAnkle")
                  LkneeAngle = calculateAngle(parts[p0index], parts[centerIndex], parts[p1index]);
                  LkneeAngle = LkneeAngle * (180/pi) 
                  document.getElementById("Lknee").innerHTML = Math.round(LkneeAngle*100)/100;
                }


                // if (hasSubArray(reqPartList, cervicalAngelReq)) {
                //   let p0index = parts.findIndex(p => p.part == "leftShoulder")
                //   let centerIndex = parts.findIndex(p => p.part == "nose")
                //   let p1index = parts.findIndex(p => p.part == "rightShoulder")
                //   cervicalAngel = calculateAngle(parts[p0index], parts[centerIndex], parts[p1index]);
                //   cervicalAngel = cervicalAngel * (180/pi) 
                //   document.getElementById("cervical").innerHTML = Math.round(cervicalAngel*100)/100;
                // //   // console.log(cervicalAngel);
                // }
  
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
    
    detectPoseInRealTime(vid);
  }

  async function loadResNet(vid) {
    pnet.net = await posenet.load({
      architecture: 'ResNet50',
      outputStride: 16,
      inputResolution: 257,
      multiplier: null,
      quantBytes: 2
    });
    detectPoseInRealTime(vid);
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
          
            peer.on('data', function (data) {
              let decodedData = new TextDecoder('utf-8').decode(data)
              let peervideo = document.querySelector('#peerVideo')
              peervideo.style.filter = decodedData
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
            return document.getElementById('peerVideo');
            // video.play();
            // return video;
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

