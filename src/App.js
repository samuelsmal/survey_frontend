import React, { Component } from 'react';
import './App.css';
import TimerMixin from 'react-timer-mixin';
import {RenderBreak, ConvergenceQuestion, Music, RenderDone, DivergentQuestion} from './components';
import {__TIMING_DURATIONS__, __MUSIC__, __LANGUAGES__} from './constants';
import {sendAnswers, getQuestions, sendAdditionalData} from './api';

// TODO some styling
// TODO handle headphone switch
// TODO send beginning of survey to server

function value_ok(val){
  return typeof(val) !== 'undefined'
}


class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user_id: '',
      answers: [],
      question: null,
      current_question_id: 1,
      music_id: 'entry',
      music_url: null,
      user_data_ok: false,
      selectedLanguage: "",
      stage_id: 0,
      count_down_start: null,
      count_down: null,
      questions: null,
      task_ptr: 0,
      question_ptr: 0,
      error_with_user_data: false,
      additional_user_data: {
        gender: undefined,
        age: undefined,
        relaxed: undefined,
        tired: undefined,
        happy: undefined,
        energetic: undefined,
        sad: undefined,
        field_of_study: undefined,
        country_of_origin: undefined,
        mother_tongue: undefined,
        email: undefined
      }
    };

    this.handleUserIdChange = this.handleUserIdChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleSubmitUserData = this.handleSubmitUserData.bind(this);
    this.handleAdditionalUserData = this.handleAdditionalUserData.bind(this);
    this.renderQuestion = this.renderQuestion.bind(this);
    this.renderUserId = this.renderUserId.bind(this);
    this.setWaitTimer = this.setWaitTimer.bind(this);
    this.setMusic = this.setMusic.bind(this);
    this.handleLanguageSelection = this.handleLanguageSelection.bind(this);
    this.progressToNextStage = this.progressToNextStage.bind(this);
    this.clearTimers = this.clearTimers.bind(this);
    this.getNextQuestion = this.getNextQuestion.bind(this);
    this.progressPtrs = this.progressPtrs.bind(this);

    this.timeout = null;
    this.count_down = null;
  }

  progressPtrs() {
    if (this.state.questions[this.state.task_ptr].length > this.state.question_ptr + 1) {
      this.setState({question_ptr: this.state.question_ptr + 1}, () => {
        this.setState({question: this.getNextQuestion()});
      });
    } else if (this.state.questions.length > this.state.task_ptr + 1) {
      this.setState({question_ptr: 0, task_ptr: this.state.task_ptr + 1, question: null},
        this.progressToNextStage);
    } else {
        this.setState({question_ptr: -1, task_ptr: -1, question: null, done: true},
          this.progressToNextStage);
    }
  }

  getNextQuestion() {
    if (this.state.questions.length > this.state.task_ptr && this.state.questions[this.state.task_ptr].length > this.state.question_ptr) {
      console.log(this.state.questions[this.state.task_ptr][this.state.question_ptr]);
      return this.state.questions[this.state.task_ptr][this.state.question_ptr];
    } else {
      return null;
    }
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

    console.log("progressing to next stage " + next_stage);

    this.setState({stage_id: next_stage, question: null, count_down: -1}, () => {
      if (next_stage === 1) {
        // first priming
        this.setMusic('ct');
        this.setWaitTimer(__TIMING_DURATIONS__['music_priming']);
      } else if (next_stage === 2) {
        // first round of questions
        this.setState({question: this.getNextQuestion()}, this.setWaitTimer(__TIMING_DURATIONS__['questions']));
      } else if (next_stage === 3) {
        // short break
        this.setWaitTimer(__TIMING_DURATIONS__['break_between_questions'])
      } else if (next_stage === 4) {
        // second q-round
        this.setState({question: this.getNextQuestion()}, this.setWaitTimer(__TIMING_DURATIONS__['questions']));
      } else if (next_stage === 5) {
        // silent break
        this.setMusic(null);
        this.setWaitTimer(__TIMING_DURATIONS__['silence']);
      } else if (next_stage === 6) {
        // second priming
        this.setMusic(2);
        this.setWaitTimer(__TIMING_DURATIONS__['music_priming']);
      } else {
        // done with everything
        this.setState({done: true});
      }
    });
  }

  setMusic(id){
    if (id in __MUSIC__) {
      this.setState({music_url: "/songs/" + __MUSIC__[id]})
    } else {
      this.setState({music_url: ""})
    }
  }

  setWaitTimer(timer_duration) {
    this.setState({
      count_down_duration: timer_duration,
      count_down: Math.floor(timer_duration / 1000),
      count_down_start: new Date().getTime()},
      () => {
        this.interval = TimerMixin.setInterval(() => {
          var seconds_to_go = Math.floor((this.state.count_down_duration - (new Date().getTime() - this.state.count_down_start)) / 1000);
          this.setState({count_down: seconds_to_go});
        }, 100);

        this.timeout = TimerMixin.setTimeout(this.progressToNextStage, timer_duration);
    });
  }

  componentDidMount() {
    this.setMusic('entry');
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
    if (event.target.value) {
      this.setState({
        answers: this.state.answers.concat([[this.state.question.id, event.target.value, new Date().toLocaleString()]]),
        value: ''
      },
        () => {
          this.progressPtrs();
          document.getElementById("question-form").reset();
          sendAnswers(this.state.user_id, this.state.answers);
        }
      );
    }

    event.preventDefault();
  }

  handleAdditionalUserData(event) {
    let t = event.target;
    this.setState({additional_user_data: {...this.state.additional_user_data,
      [t.name]: t.value}});
  }

  handleSubmitUserData(event) {
    let t = Object.keys(this.state.additional_user_data)
    let all_good = t.slice(0, t.length - 1).reduce((acc, el) => acc && value_ok(this.state.additional_user_data[el]), true)

    this.setState({error_with_user_data: !all_good}, () => {
      if (this.state.user_id !== null
        && this.state.user_id !== ''
        && __LANGUAGES__.includes(this.state.selectedLanguage)
        && all_good) {
        sendAdditionalData({...this.state.additional_user_data, user_id: this.state.user_id});
        getQuestions(this.state.user_id, this.state.selectedLanguage).then(response => {
          console.log(response);
          this.setState({user_data_ok: true, questions: response.data},
            this.progressToNextStage);
        }).catch(error => console.log(error));
      }
    })

    event.preventDefault();
  }

  handleLanguageSelection(event) {
    this.setState({selectedLanguage: event.target.value});
  }

  renderQuestion() {
    let q;
    if (this.state.question && this.state.question.id.startsWith('ct')) {
      q = <ConvergenceQuestion question={this.state.question.question}
        possibleAnswers={this.state.question.possible_answers}
        onChange={this.handleSubmit} />;
    } else {
      q = <DivergentQuestion />;
    }

    return (
      <div className="App">
        <Music music_url={this.state.music_url} />
        <div className="countDownTimer">
          { this.state.count_down >= 0 &&
            <p>{this.state.count_down} seconds to go</p>
          }
        </div>
        <form onSubmit={this.handleSubmit} className="form" id="question-form">
          {q}
        </form>
      </div>
    );
  }

  renderUserId(){
    return (
      <div className="App welcome">
        <Music music_url={this.state.music_url} />
        <h1>Welcome to our little study!</h1>
        <p>It will take about 30 min of your time to complete this study.</p>
        <p>Please make sure that your headphones are plugged in. You should hear a song right now.</p>
        <p>The study will start as soon as you press submit. So make sure that you are ready.</p>
        <p>TODO DESCRIBE OUTLINE OF PROCEDURE</p>
        <p>Good luck!</p>
        <form onSubmit={this.handleSubmitUserData} className="form">
          { this.state.error_with_user_data &&
              <p className="error_field">Some error with the form. Please fill it out completely (except for the email address).</p>
          }
          <label className="label">Please enter the given code from your sheet of paper.</label>
          <input className="text" type="textarea" value={this.state.user_id} onChange={this.handleUserIdChange}/>
          <label className="label">Select your preferred language.</label>
          <select value={this.state.selectedLanguage} onChange={this.handleLanguageSelection}>
            <option value="">select one</option>
            <option value="en">English</option>
            <option value="de">Deutsch</option>
            <option value="fr">Francais</option>
          </select>
          <label className="label">Enter your gender:</label>
          <select value={this.state.additional_user_data.gender} name="gender" onChange={this.handleAdditionalUserData}>
            <option value="">select one</option>
            <option value="m">male</option>
            <option value="f">female</option>
            <option value="o">other</option>
          </select>
          <label className="label">Age</label>
          <input type="text" name="age" value={this.state.additional_user_data.age} onChange={this.handleAdditionalUserData} />
          <label className="label">How are you feeling right now? The scale goes from 1 to 5, with 5 feeling very much so and 1 feeling very not so.</label>
          <label className="label">Relaxed</label>
          <select value={this.state.additional_user_data.relaxed} name="relaxed" onChange={this.handleAdditionalUserData}>
            <option value="">select one</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
          <label className="label">Tired</label>
          <select value={this.state.additional_user_data.relaxed} name="tired" onChange={this.handleAdditionalUserData}>
            <option value="">select one</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
          <label className="label">Happy</label>
          <select value={this.state.additional_user_data.happy} name="happy" onChange={this.handleAdditionalUserData}>
            <option value="">select one</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
          <label className="label">Energetic</label>
          <select value={this.state.additional_user_data.energetic} name="energetic" onChange={this.handleAdditionalUserData}>
            <option value="">select one</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
          <label className="label">Sad</label>
          <select value={this.state.additional_user_data.sad} name="sad" onChange={this.handleAdditionalUserData}>
            <option value="">select one</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
          <label className="label">Field of study / Profession</label>
          <input type="text" name="field_of_study" value={this.state.additional_user_data.field_of_study} onChange={this.handleAdditionalUserData}/ >
          <label className="label">Country of origin</label>
          <input type="text" name="country_of_origin" value={this.state.additional_user_data.country_of_origin} onChange={this.handleAdditionalUserData}/ >
          <label className="label">Mother tongue</label>
          <input type="text" name="monther_tongue" value={this.state.additional_user_data.monther_tongue} onChange={this.handleAdditionalUserData}/ >
          <label className="label">If you would like some feedback, please also enter your email</label>
          <input type="text" name="email" value={this.state.additional_user_data.email} onChange={this.handleAdditionalUserData}/ >
          <input className="submit_btn" type="submit" value="Submit"/>
        </form>
      </div>
    );
  }

  render() {
    if (!this.state.done) {
      if (this.state.user_data_ok) {
        if (this.state.question === null) {
          return <RenderBreak count_down={this.state.count_down} music_url={this.state.music_url}/>;
        } else {
          return this.renderQuestion();
        }
      } else {
        return this.renderUserId();
      }
    } else {
      return <RenderDone />;
    }
  }
}

export default App;
