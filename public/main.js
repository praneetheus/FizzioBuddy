const posenet = require('@tensorflow-models/posenet');
let Peer = require('simple-peer'); 
let socket = io()
const video = document.querySelector('video')
const poseNetButton = document.querySelector('#poseNetButton')
const disablePosenetButton = document.querySelector('#disablePosenet')
let client = {}
let disablePosenet = false; 
// let videoWidth = video.videoWidth;
// let videoHeight = video.videoHeight;

let net;
let color = 'red';

const pnet = {
    algorithm: 'single-pose',
    input: {
      architecture: 'MobileNetV1',
      outputStride: 16,
      inputResolution: 513,
      multiplier: 0.50,
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

  pnet.net = ({
    architecture: pnet.input.architecture,
    outputStride: pnet.input.outputStride,
    inputResolution: pnet.input.inputResolution,
    multiplier: pnet.input.multiplier,
    quantBytes: pnet.input.quantBytes
  });


  function detectPoseInRealTime(vid, net) {
    if (!disablePosenet) {
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
    
      async function poseDetectionFrame() {
        let poses = [];
        let minPoseConfidence;
        let minPartConfidence;
    
        switch (pnet.algorithm) {
          case 'single-pose':
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
        // console.log('just after switch')
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
            let shoulderAngleReq = [];
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
                  let p1index = parts.findIndex(p => p.part == "rightWrist")
                  let centerIndex = parts.findIndex(p => p.part == "rightElbow")
                  elbowAngle = calculateAngle(parts[p0index], parts[p1index], parts[centerIndex]);
                  // console.log(elbowAngle);
                  // console.log(calculateAngle(parts[p0index], parts[p1index], parts[centerIndex]));
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
    if (!disablePosenet) {
      pnet.net = await posenet.load({
        architecture: pnet.input.architecture,
        outputStride: pnet.input.outputStride,
        inputResolution: pnet.input.inputResolution,
        multiplier: pnet.input.multiplier,
        quantBytes: pnet.input.quantBytes
      });
    }
  
    detectPoseInRealTime(vid, net);
  }
//   end posenet

// calculate angle
// https://stackoverflow.com/questions/1211212/how-to-calculate-an-angle-from-three-points
// p0, p1, c = {x, y}
function calculateAngle(p0,p1,center) {
  // let p0c = Math.pow(c.x-p0.x,2) + Math.pow(c.y-p0.y,2); // p0->c (b)   
  // let p1c = Math.pow(c.x-p1.x,2) + Math.pow(c.y-p1.y,2); // p1->c (a)
  // let p0p1 = Math.pow(p1.x-p0.x,2) + Math.pow(p1.y-p0.y,2); // p0->p1 (c)
  
  let b = Math.pow(p1.x - p0.x, 2) + Math.pow(p1.y - p0.y, 2);
  let a = Math.pow(p1.x - center.x, 2) + Math.pow(p1.y - center.y, 2);
  let c = Math.pow(center.x - p0.x, 2) + Math.pow(center.y - p0.y, 2);

  return Math.acos((a + b - c)/Math.sqrt(4*a*b));
  // return Math.acos((p1c*p1c+p0c*p0c-p0p1*p0p1)/(2*p1c*p0c));
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
        poseNetButton.addEventListener('click', () => {
          // console.log('I can click');
          disablePosenet = false;
          const vivi = returnPeerVideo();
          // console.log(typeof(vivi));
          loadPoseNet(vivi);
        })

        disablePosenetButton.addEventListener('click', () => {
          disablePosenet = true; 
        })

        function returnPeerVideo() {
            let video = document.getElementById('peerVideo');
            video.play();
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
        }

        function RemovePeer() {
            document.getElementById("peerVideo").remove();
            // document.getElementById("muteText").remove();
            if (client.peer) {
                client.peer.destroy()
            }
        }

        socket.on('BackOffer', FrontAnswer)
        socket.on('BackAnswer', SignalAnswer)
        socket.on('SessionActive', SessionActive)
        socket.on('CreatePeer', MakePeer)
        socket.on('Disconnect', RemovePeer)

    })
    .catch(err => document.write(err))

