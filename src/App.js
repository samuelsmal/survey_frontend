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

var __MUSIC__ = {
  entry: "gtr-nylon22.wav",
  ct: "",
  dt: ""
}

function sendAnswers(user_id, answers) {
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


class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user_id: null,
      value: '',
      answers: [],
      questions: ['brick', 'toothbrush', 'gummy beer'],
      current_question_id: 0,
      music_id: 'entry',
      music_url: null
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleSubmitUserid = this.handleSubmitUserid.bind(this);
    this.renderForm = this.renderForm.bind(this);
    this.renderUserId = this.renderUserId.bind(this);
    this.setTimer = this.setTimer.bind(this);
    this.setMusic = this.setMusic.bind(this);

    this.interval = null;
  }

  setMusic(id){
    if (id in __MUSIC__) {
      this.setState({music_url: "/songs/" + __MUSIC__[id]})
    } else {
      this.setState({music_url: ""})
    }
  }

  setTimer (){
    this.interval = TimerMixin.setInterval(() => {
      console.log("next question");
      if (this.state.current_question_id < this.state.questions.length - 1) {
        this.setState({current_question_id: this.state.current_question_id + 1})
      }
    }, __QUESTION_DELAY__);
  }

  componentDidMount() {
    // TODO set this!
    //this.setMusic('entry');
  }

  compnentWillUnmount() {
    if (this.interval !== null) {
      TimerMixin.clearInterval(this.interval);
    }
  }

  handleChange(event) {
    this.setState({value: event.target.value});
  }

  handleSubmit(event) {
    this.setState({answers: this.state.answers.concat([this.state.current_question_id,
      this.state.value, Date.now()]), value: ''},
      () => {
        sendAnswers(this.state.user_id, this.state.answers);
      }
    );

    event.preventDefault();
  }

  handleSubmitUserid(event) {
    this.setState({user_id: this.state.value, value: ''},
      () => {
        console.log('code saved')
        this.setTimer()
      }
    );

    event.preventDefault();
  }

  renderForm() {
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

  renderUserId(){
    return (
      <div className="App welcome">
      <audio autoPlay="autoplay" loop="True">
        <source src={process.env.PUBLIC_URL + this.state.music_url} />
      </audio>
        <h1>Welcome to our little study!</h1>
        <p>It will take about 30 min of your time to complete this study.</p>
        <p>Please make sure that your headphones are plugged in. You should hear a song right now.</p>
        <form onSubmit={this.handleSubmitUserId} className="form">
          <label className="label">Please enter the given code from your sheet of paper.</label>
          <input className="textarea" type="textarea" value={this.state.value} onChange={this.handleChange}/>
          <input className="submit_btn" type="submit" value="Submit"/>
        </form>
      </div>
    );
  }

  render() {
    if (this.state.user_id === null) {
      console.log('???')
      return this.renderUserId()
    } else {
      return this.renderForm()
    }
  }
}

export default App;
