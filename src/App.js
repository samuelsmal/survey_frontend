import axios from 'axios';
import React, { Component } from 'react';
import './App.css';
import TimerMixin from 'react-timer-mixin';

// TODO send responses to server
// TODO auth with server (session cookie should be enough)
// TODO some styling
// TODO maybe show a countdown?
// TODO make question change more visible

// TODO add login screen where people enter number -> this number sets 
var __BASE_URL__ = 'http://127.0.0.1:5000';
var __QUESTION_DELAY__ = 6000;
var __USER_ID__ = null;

function sendAnswers(answers) {
  console.log('in send answers ' + answers)
  axios.get(__BASE_URL__ + '/test')
        .then((response) => {
          console.log('resp from test' + response);
        })
        .catch((error) => {
          console.log('error in gein gett' + error);
        });
  axios.post(__BASE_URL__ + '/submitAnswers', {
    user_id: __USER_ID__,
    answers: answers
  }).then((response) => {
      console.log(response);
  }).catch((error) => {
      console.log(error);
  });
}


class App extends Component {
  constructor(props) {
    super(props);
    this.state = { value: '',
      answers: [],
      questions: ['brick', 'toothbrush', 'gummy beer'],
      current_question_id: 0,
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    this.interval = TimerMixin.setInterval(() => {
      console.log("next question");
      if (this.state.current_question_id < this.state.questions.length - 1) {
        this.setState({current_question_id: this.state.current_question_id + 1})
      }
    }, __QUESTION_DELAY__);
  }

  compnentWillUnmount() {
    TimerMixin.clearInterval(this.interval);
  }

  handleChange(event) {
    this.setState({value: event.target.value});
  }

  handleSubmit(event) {
    this.setState({answers: this.state.answers.concat([this.state.current_question_id, 
      this.state.value, Date.now()]), value: ''},
      () => {
        sendAnswers(this.state.answers);
        console.log(this.state.answers);
      }
    );

    event.preventDefault();
  }

  render() {
    return (
      <div className="App">
        <p>Press <b>ENTER</b> after each new word</p>
        <form onSubmit={this.handleSubmit} className="form">
          <label className="label">Come up with as many uses for object <b>{this.state.questions[this.state.current_question_id]}</b></label>
          <input className="textarea" type="textarea" value={this.state.value} onChange={this.handleChange}/>
          <input className="submit_btn" type="submit" value="Submit"/>
        </form>

      </div>
    );
  }
}

export default App;
