const FEEDBACK_STORAGE_KEY = 'telecom-route-feedback-v1';

export function createFeedbackController({ ui, state, feedbackOptions, setStatus, getFloorSequence, getPathDistance }) {
  function populateFeedbackControls() {
    feedbackOptions.forEach((option) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'feedback-button';
      button.textContent = option.label;
      button.disabled = true;
      button.dataset.feedback = option.id;
      button.addEventListener('click', () => saveFeedback(option));
      ui.feedbackRow.append(button);
    });
  }

  function saveFeedback(option) {
    if (!state.routePoints.length) {
      return;
    }

    const record = {
      id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}`,
      type: option.id,
      label: option.label,
      destination: state.routeLabel,
      floors: getFloorSequence(state.routePoints),
      distance: Number(getPathDistance(state.routePoints).toFixed(2)),
      createdAt: new Date().toISOString()
    };

    const records = readFeedbackRecords();
    records.push(record);
    localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(records));
    updateFeedbackCount();
    setStatus('Feedback saved', 'ready');
  }

  function readFeedbackRecords() {
    try {
      return JSON.parse(localStorage.getItem(FEEDBACK_STORAGE_KEY) || '[]');
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  function updateFeedbackCount() {
    const count = readFeedbackRecords().length;
    ui.feedbackCount.textContent = `${count} local feedback ${count === 1 ? 'record' : 'records'}`;
  }

  function setFeedbackEnabled(enabled) {
    ui.feedbackRow.querySelectorAll('button').forEach((button) => {
      button.disabled = !enabled;
    });
  }

  return {
    populateFeedbackControls,
    updateFeedbackCount,
    setFeedbackEnabled
  };
}
