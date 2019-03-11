import axios from 'axios';

import {__BASE_URL__} from './constants';

export function sendAnswers(user_id, answers) {
  console.log('in send answers ' + answers)
  axios.get(__BASE_URL__ + '/test')
        .then((response) => {
          console.log('resp from test' + response);
        })
        .catch((error) => {
          console.log('error in gein gett' + error);
        });
  axios.post(__BASE_URL__ + '/submitAnswers', {
    user_id: user_id,
    answers: answers
  }).then((response) => {
      console.log(response);
  }).catch((error) => {
      console.log(error);
  });
}

export function getQuestions(user_id, language) {
  console.log('getting questions for '+ user_id);
  return axios.get(__BASE_URL__ + "/getQuestions/" + user_id + "/" + language);
}
