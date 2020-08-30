import io from 'socket.io-client';
const predictContainer = document.getElementById('predictContainer');
const predictButton = document.getElementById('predict-button');

const socket =
  io('http://localhost:8001',
    { reconnectionDelay: 300, reconnectionDelayMax: 300 });

const BAR_WIDTH_PX = 300;

const testSample = [2.668, -114.333, -1.908, 4.786, 25.707, -45.21, 78, 0];

predictButton.onclick = () => {
  predictButton.disabled = true;
  socket.emit('predictSample', testSample);
};

// functions to handle socket events
socket.on('connect', () => {
  document.getElementById('trainingStatus').innerHTML = 'Training in Progress';
});

socket.on('accuracyPerClass', (accPerClass) => {
  plotAccuracyPerClass(accPerClass);
});

socket.on('trainingComplete', () => {
  document.getElementById('trainingStatus').innerHTML = 'Training Complete';
  document.getElementById('predictSample').innerHTML = '[' + testSample.join(', ') + ']';
  predictContainer.style.display = 'block';
});

socket.on('predictResult', (result) => {
  plotPredictResult(result);
});

socket.on('disconnect', () => {
  document.getElementById('trainingStatus').innerHTML = '';
  predictContainer.style.display = 'none';
  document.getElementById('waiting-msg').style.display = 'block';
  document.getElementById('table').style.display = 'none';
});

// functions to update display
function plotAccuracyPerClass(accPerClass) {
  document.getElementById('table').style.display = 'block';
  document.getElementById('waiting-msg').style.display = 'none';

  const table = document.getElementById('table-rows');
  table.innerHTML = '';

  // Sort class names before displaying.
  const sortedClasses = Object.keys(accPerClass).sort();
  sortedClasses.forEach(label => {
    const scores = accPerClass[label];
    // Row.
    const rowDiv = document.createElement('div');
    rowDiv.className = 'row';
    table.appendChild(rowDiv);

    // Label.
    const labelDiv = document.createElement('div');
    labelDiv.innerText = label;
    labelDiv.className = 'label';
    rowDiv.appendChild(labelDiv);

    // Score.
    const scoreContainer = document.createElement('div');
    scoreContainer.className = 'score-container';
    scoreContainer.style.width = BAR_WIDTH_PX + 'px';
    rowDiv.appendChild(scoreContainer);

    plotScoreBar(scores.training, scoreContainer);
    if (scores.validation) {
      plotScoreBar(scores.validation, scoreContainer, 'validation');
    }
  });
}

function plotScoreBar(score, container, className = '') {
  const scoreDiv = document.createElement('div');
  scoreDiv.className = 'score ' + className;
  scoreDiv.style.width = (score * BAR_WIDTH_PX) + 'px';
  scoreDiv.innerHTML = (score * 100).toFixed(1);
  container.appendChild(scoreDiv);
}

function plotPredictResult(result) {
  predictButton.textContent = 'Predict Pitch';
  predictButton.disabled = false;
  document.getElementById('predictResult').innerHTML = result;
  console.log(result);
}