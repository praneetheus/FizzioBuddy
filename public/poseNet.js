let net;
let color = 'red';

const guiState = {
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

  guiState.net = ({
    architecture: guiState.input.architecture,
    outputStride: guiState.input.outputStride,
    inputResolution: guiState.input.inputResolution,
    multiplier: guiState.input.multiplier,
    quantBytes: guiState.input.quantBytes
  });


  function detectPoseInRealTime(vid, net) {
    // console.log("I am working");
    // console.log(typeof(vid))
    const canvas = document.getElementById('peerOutput');
    const vi = document.getElementById('peerVideo');
    const ctx = canvas.getContext('2d');
    const videoWidth = 600;
    const videoHeight = 500;
    vi.width = videoWidth;
    vi.height = videoHeight;

    const flipPoseHorizontal = true;
  
    canvas.width = videoWidth;
    canvas.height = videoHeight;
  
    async function poseDetectionFrame() {
      let poses = [];
      let minPoseConfidence;
      let minPartConfidence;
  
      switch (guiState.algorithm) {
        case 'single-pose':
          const pose = await guiState.net.estimatePoses(vid, {
            flipHorizontal: flipPoseHorizontal,
            decodingMethod: 'single-person'
          });
  
          poses = poses.concat(pose);
          // console.log(poses);
          minPoseConfidence = +guiState.singlePoseDetection.minPoseConfidence;
          minPartConfidence = +guiState.singlePoseDetection.minPartConfidence;
          break;
      }
      // console.log('just after switch')
      ctx.clearRect(0, 0, videoWidth, videoHeight);
      // ctx.drawImage(vid, 0, 0, videoWidth, videoHeight);
      // ctx.restore();
      if (guiState.output.showVideo) {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.translate(-videoWidth, 0);
        ctx.drawImage(vid, 0, 0, videoWidth, videoHeight);
        ctx.restore();
      }
  
      function drawKeypoints(keypoints, minConfidence, ctx, scale = 1) {
          // console.log("inside draw keypoint");
          for (let i = 0; i < keypoints.length; i++) {
              const keypoint = keypoints[i];
              // console.log(keypoint)
              // break;
              if (keypoint.score < minConfidence) {
                continue;
              }
              // console.log(keypoint.part);
              const {y, x} = keypoint.position;
              drawPoint(ctx, y * scale, x * scale, 3, color, keypoint.part);
            }
      }
      function drawPoint(ctx, y, x, r, color, part) {
          console.log(x, y)
          ctx.beginPath();
          ctx.arc(x, y, r, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
          // ctx.textAlign = "start";
          ctx.fillText(part, x, y);
      }
      // console.log("done switch");
      poses.forEach(({score, keypoints}) => {
        if (score >= minPoseConfidence) {
          if (guiState.output.showPoints) {
            drawKeypoints(keypoints, minPartConfidence, ctx);
          }
        }
      });
      requestAnimationFrame(poseDetectionFrame);
    }
  
    poseDetectionFrame();
  }

  async function loadPoseNet(vid) {
    //   vid = returnPeerVideo();
    guiState.net = await posenet.load({
      architecture: guiState.input.architecture,
      outputStride: guiState.input.outputStride,
      inputResolution: guiState.input.inputResolution,
      multiplier: guiState.input.multiplier,
      quantBytes: guiState.input.quantBytes
    });
  
    detectPoseInRealTime(vid, net);
  }
//   end posenet
