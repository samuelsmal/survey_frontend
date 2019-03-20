import axios from 'axios';

import {__BASE_URL__} from './constants';

export function sendAnswers(user_id, answers) {
  axios.post(__BASE_URL__ + '/submitAnswers', {
    user_id: user_id,
    answers: answers
  }).then((response) => {
      console.debug(response);
  }).catch((error) => {
      console.debug(error);
  });
}

export function getQuestions(user_id, language) {
  console.debug('getting questions for '+ user_id);
  return axios.get(__BASE_URL__ + "/getQuestions/" + user_id + "/" + language);
}

export function sendAdditionalData(data) {
  console.debug("sending additional data")
  console.debug(data)
  axios.post(__BASE_URL__ + '/submitUserData', data).then((response) => {
      console.debug(response);
  }).catch((error) => {
      console.debug(error);
  });
}
