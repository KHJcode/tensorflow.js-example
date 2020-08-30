require('@tensorflow/tfjs-node');

const http = require('http');
const socketio = require('socket.io');
const pitch_type = require('./pitch_type');
const sleep = require('./utils').sleep;

const TIMEOUT_BETWEEN_EPOCHS_MS = 500;
const PORT = 8001;

async function run() {
  const port = process.env.PORT || PORT;
  const server = http.createServer();
  const io = socketio(server);
  let useTestData = true;

  server.listen(port, () => {
    console.log(`Running socket on port: ${port}`);
  });

  io.on('connection', (socket) => {
    socket.on('test_data', (value) => {
      useTestData = value === 'true' ? true : false;
    });

    socket.on('predictSample', async (sample) => {
      console.log('received predict request');
      io.emit('predictResult', await pitch_type.predictSample(sample));
    });
  });

  io.emit('accuracyPerClass', await pitch_type.evaluate(useTestData));
  await sleep(TIMEOUT_BETWEEN_EPOCHS_MS);

  let numTrainingIterations = 10;
  for (var i = 0; i < numTrainingIterations; i++) {
    console.log(`Training iteration : ${i + 1} / ${numTrainingIterations}`);
    await pitch_type.model.fitDataset(pitch_type.trainingData, { epochs: 1 });
    io.emit('accuracyPerClass', await pitch_type.evaluate(useTestData));
    await sleep(TIMEOUT_BETWEEN_EPOCHS_MS);
  }

  io.emit('trainingComplete', true);
  console.log('training complete');

}

run();