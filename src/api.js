import axios from 'axios';

import {__BASE_URL__} from './constants';

export function sendAnswers(api_token, user_id, answers) {
  axios.post(__BASE_URL__ + '/submitAnswers/' + api_token, {
    user_id: user_id,
    answers: answers
  }).then((response) => {
      console.debug(response);
  }).catch((error) => {
      console.debug(error);
  });
}

export function getQuestions(api_token, user_id, language) {
  return axios.get(__BASE_URL__ + '/getQuestions/' + api_token + '/' + user_id + '/' + language);
}

export function sendAdditionalData(api_token, data) {
  axios.post(__BASE_URL__ + '/submitUserData/' + api_token, data).then((response) => {
      console.debug(response);
  }).catch((error) => {
      console.debug(error);
  });
}
