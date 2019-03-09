import axios from 'axios';
import React, { Component } from 'react';
import './App.css';
import TimerMixin from 'react-timer-mixin';
import {convergence_tasks_fr} from './questions';

// TODO some styling
// TODO put either questions into their own component or play audio through js
// TODO handle headphone switch

var __BASE_URL__ = 'http://127.0.0.1:5000';
var __QUESTION_DELAY__ = 10 // 6000;
var __MUSIC_PRIME_TIME__ = 10 // 15000; // 15"
var __LONG_BREAK_TIME__ = 2 * 60 * 1000;

var __MUSIC__ = {
  entry: "gtr-nylon22.wav",
  ct: "",
  dt: ""
};

var __LANGUAGES__ = ['en', 'de', 'fr'];
var __LANGUAGE_QUESTION_MAP__ = {
  'fr': {
    'convergence_tasks': convergence_tasks_fr,
    'divergence_tasks': []
  }
};

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

function getQuestion(language_id, task, question_id) {
  var qs = __LANGUAGE_QUESTION_MAP__[language_id][task];

  for (var q in qs) {
    if (q['id'] === question_id) {
      return q;
    }
  }
}


class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user_id: '',
      answers: [],
      questions: null,
      current_question_id: 1,
      music_id: 'entry',
      music_url: null,
      user_data_ok: false,
      selectedLanguage: "",
      stage_id: 0,
      count_down_start: null,
      count_down: null
    };

    this.handleUserIdChange = this.handleUserIdChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleSubmitUserData = this.handleSubmitUserData.bind(this);
    this.renderBreak = this.renderBreak.bind(this);
    this.renderForm = this.renderForm.bind(this);
    this.renderUserId = this.renderUserId.bind(this);
    this.setQuestionTimer = this.setQuestionTimer.bind(this);
    this.setWaitTimer = this.setWaitTimer.bind(this);
    this.setMusic = this.setMusic.bind(this);
    this.handleLanguageSelection = this.handleLanguageSelection.bind(this);
    this.progressToNextStage = this.progressToNextStage.bind(this);
    this.clearTimers = this.clearTimers.bind(this);

    this.timeout = null;
    this.count_down = null;
  }

  progressToNextStage(){
    /* 0: basic user data input
     * 1: first priming phase with first music
     * 2: first questionnaire with first music
     * 3: break
     * 4: second questionnaire with first music
     * 5: longer break
     * 6: second priming phase with second music
     * 7: first questionnaire with second music
     * 8: break
     * 9: second questionnaire with second music
     * 10: longer break
     * 11: third priming phase with self-chosen music
     */
    var current_stage = this.state.stage_id;
    var next_stage = current_stage + 1;

    this.clearTimers();

    console.log("progrssing to next stage " + next_stage);

    // TODO there will probably be an issue with the

    this.setState({stage_id: next_stage, questions: null, count_down: -1}, () => {
      if (next_stage === 1) {
        this.setMusic(1);
        this.setWaitTimer('short');
      } else if (next_stage === 2) {
        // TODO fix this hardcoded piece
        this.setState({questions: __LANGUAGE_QUESTION_MAP__[this.state.selectedLanguage]['convergence_tasks']}, () => { console.log(this.state.questions); this.setQuestionTimer()});
      } else if (next_stage === 3) {
        this.setWaitTimer('short')
      } else if (next_stage === 4) {
        this.setState({questions: __LANGUAGE_QUESTION_MAP__[this.state.selectedLanguage]['convergence_tasks']});
        this.setQuestionTimer();
      } else if (next_stage === 5) {
        this.setMusic(null);
        this.setWaitTimer('long');
      } else if (next_stage === 6) {
        this.setMusic(2);
        this.setWaitTimer('short');
      } else if (next_stage === 7) {
        this.setState({questions: __LANGUAGE_QUESTION_MAP__[this.state.selectedLanguage]['convergence_tasks']});
        this.setQuestionTimer();
      } else if (next_stage === 8) {
        this.setWaitTimer('short');
      }

      // TODO finish this
    });
  }

  setMusic(id){
    if (id in __MUSIC__) {
      this.setState({music_url: "/songs/" + __MUSIC__[id]})
    } else {
      this.setState({music_url: ""})
    }
  }

  setQuestionTimer (){
    this.setState({count_down: __QUESTION_DELAY__, count_down_start: new Date().getTime()}, () => {
      this.interval = TimerMixin.setInterval(() => {
        var seconds_to_go = (__QUESTION_DELAY__ - (new Date().getTime() - this.state.count_down_start)) / 1000;
        this.setState({count_down: seconds_to_go});
      });

      this.timeout = TimerMixin.setTimeout(this.progressToNextStage, __QUESTION_DELAY__);
    });
  }

  setWaitTimer(wait_timer_type) {
    var timer_duration = (wait_timer_type === 'short' ? __MUSIC_PRIME_TIME__ : __LONG_BREAK_TIME__);
    this.setState({
      count_down: timer_duration,
      count_down_start: new Date().getTime()},
      () => {
        this.interval = TimerMixin.setInterval(() => {
          var seconds_to_go = (timer_duration - (new Date().getTime() - this.state.count_down_start)) / 1000;
          console.log(seconds_to_go);
          this.setState({count_down: seconds_to_go});
        }, timer_duration);

        this.timeout = TimerMixin.setTimeout(this.progressToNextStage, timer_duration);
    });
  }

  componentDidMount() {
    // TODO set this!
    //this.setMusic('entry');
  }

  clearTimers() {
    if (this.timeout !== null) {
      TimerMixin.clearTimeout(this.timeout);
    }

    if (this.interval !== null) {
      TimerMixin.clearInterval(this.interval);
    }
  }

  compnentWillUnmount() {
    this.clearTimers();
  }

  handleUserIdChange(event) {
    this.setState({user_id: event.target.value});
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

  handleSubmitUserData(event) {
    if (this.state.user_id !== null
      && this.state.user_id !== ''
      && __LANGUAGES__.includes(this.state.selectedLanguage)) {
      this.setState({user_data_ok: true}, this.progressToNextStage);
    }

    event.preventDefault();
  }

  handleLanguageSelection(event) {
    this.setState({selectedLanguage: event.target.value});
  }

  renderBreak() {
    return (
      <div className="App">
        <p>break</p>
        { this.state.count_down >= 0 &&
          <p>{this.state.count_down} seconds to go</p>
        }
      </div>
    )
  }

  renderForm() {
    return (
      <div className="App">
        <p>Press <b>ENTER</b> after each new word</p>
        <form onSubmit={this.handleSubmit} className="form">
          <label className="label">Come up with as many uses for object <b>{getQuestion(this.state.selectedLanguage, 'convergence_tasks', this.question_id)['question']}</b></label>
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
        <p>The study will start as soon as you press submit. So make sure that you are ready.</p>
        <p>TODO DESCRIBE OUTLINE OF PROCEDURE</p>
        <p>Good luck!</p>
        <form onSubmit={this.handleSubmitUserData} className="form">
          <label className="label">Please enter the given code from your sheet of paper.</label>
          <input className="textarea" type="textarea" value={this.state.user_id} onChange={this.handleUserIdChange}/>
          <label className="label">Select your preferred language.</label>
          <select value={this.state.selectedLanguage} onChange={this.handleLanguageSelection}>
            <option value="">select one</option>
            <option value="en">English</option>
            <option value="de">Deutsch</option>
            <option value="fr">Francais</option>
          </select>
          <input className="submit_btn" type="submit" value="Submit"/>
        </form>
      </div>
    );
  }

  render() {
    if (this.state.user_data_ok) {
      if (this.state.questions === null) {
        return this.renderBreak()
      } else {
        return this.renderForm()
      }
    } else {
      return this.renderUserId()
    }
  }
}

export default App;
