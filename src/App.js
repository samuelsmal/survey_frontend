import React, { Component } from 'react';
import './App.css';
import TimerMixin from 'react-timer-mixin';
import {MoodQuestionaire, RenderBreak, ConvergenceQuestion, Music, RenderDone, DivergentQuestion} from './components';
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
      music_url: null,
      user_data_ok: false,
      selectedLanguage: "",
      stage_id: -1,
      music_order: null,
      count_down_start: null,
      count_down: null,
      questions: null,
      task_ptr: -1,
      prev_task_ptr: -1,
      question_ptr: 0,
      error_with_user_data: false,
      additional_user_data: {
        gender: undefined,
        age: undefined,
        field_of_study: undefined,
        country_of_origin: undefined,
        mother_tongue: undefined,
        email: undefined
      },
      displayMoodQuestion: false,
      mood_values: [],
      current_mood_values: null,
      displaySelfChosenPage: false,
      self_chosen_music: {
        artist: "",
        title: "",
        genre: ""
      },
      error_with_self_chosen_music_data: false
    };

    this.handleUserIdChange = this.handleUserIdChange.bind(this);
    this.handleConvergentAnswerSubmission = this.handleConvergentAnswerSubmission.bind(this);
    this.handleDivergentAnswerSubmission = this.handleDivergentAnswerSubmission.bind(this);
    this.handleSubmitUserData = this.handleSubmitUserData.bind(this);
    this.handleAdditionalUserData = this.handleAdditionalUserData.bind(this);
    this.handleMoodQuestionaire = this.handleMoodQuestionaire.bind(this);
    this.renderQuestion = this.renderQuestion.bind(this);
    this.renderWelcomePage = this.renderWelcomePage.bind(this);
    this.setWaitTimer = this.setWaitTimer.bind(this);
    this.setMusic = this.setMusic.bind(this);
    this.handleLanguageSelection = this.handleLanguageSelection.bind(this);
    this.progressToNextStage = this.progressToNextStage.bind(this);
    this.clearTimers = this.clearTimers.bind(this);
    this.getNextQuestion = this.getNextQuestion.bind(this);
    this.progressPtrs = this.progressPtrs.bind(this);
    this.handleSelfChosenMusicChange = this.handleSelfChosenMusicChange.bind(this);
    this.handleSelfChosenMusicSubmit = this.handleSelfChosenMusicSubmit.bind(this);
    this.progressTaskPtr = this.progressTaskPtr.bind(this);

    this.timeout = null;
    this.count_down = null;


    // the first stage is not listed here
    this.stages = [
      (stage_id)=> {
        this.setMusic(null);
        this.setState({displayMoodQuestion: true});
      },
      (stage_id)=> {
        // first priming
        this.setMusic(this.state.music_order[0])
        this.setWaitTimer(__TIMING_DURATIONS__['music_priming']);
      },
      (stage_id)=>{
        this.progressTaskPtr();
      },
      (stage_id)=>{
        // short break
        this.setWaitTimer(__TIMING_DURATIONS__['break_between_questions']);
      },
      (stage_id)=>{
        this.progressTaskPtr();
      },
      (stage_id)=> {
        // second round
        this.setMusic(null);
        this.setState({displayMoodQuestion: true});
      },
      (stage_id)=>{
        // silent break
        this.setWaitTimer(__TIMING_DURATIONS__['silence']);
      },
      (stage_id)=>{
        // second priming
        this.setMusic(this.state.music_order[1]);
        this.setWaitTimer(__TIMING_DURATIONS__['music_priming']);
      },
      (stage_id)=>{
        // first round of questions
        this.progressTaskPtr();
      },
      (stage_id)=>{
        // short break
        this.setWaitTimer(__TIMING_DURATIONS__['break_between_questions']);
      },
      (stage_id)=>{
        this.progressTaskPtr();
      },
      (stage_id)=> {
        // third round
        this.setMusic(null);
        this.setState({displayMoodQuestion: true});
      },
      (stage_id)=>{
        // silent break
        this.setWaitTimer(__TIMING_DURATIONS__['silence']);
      },
      (stage_id)=>{
        this.setMusic(this.state.music_order[2]);
        this.setWaitTimer(__TIMING_DURATIONS__['music_priming']);
      },
      (stage_id)=>{
        this.progressTaskPtr();
      },
      (stage_id)=>{
        // short break
        this.setWaitTimer(__TIMING_DURATIONS__['break_between_questions']);
      },
      (stage_id)=>{
        // second q-round
        this.progressTaskPtr();
      },
      (stage_id)=> {
        // third round
        this.setMusic(null);
        this.setState({displayMoodQuestion: true});
      },
      (stage_id)=>{
        this.setState({displaySelfChosenPage: true})
      },
      (stage_id)=>{
        this.setState({displaySelfChosenPage: false})
        this.setWaitTimer(__TIMING_DURATIONS__['music_priming']);
      },
      (stage_id)=>{
        this.progressTaskPtr();
      },
      (stage_id)=>{
        // short break
        this.setWaitTimer(__TIMING_DURATIONS__['break_between_questions']);
      },
      (stage_id)=>{
        this.progressTaskPtr();
      },
      (stage_id)=> {
        this.setState({displayMoodQuestion: true});
      },
    ];
  }

  progressTaskPtr() {
    // set the progression of the task ptr into stone... not the best idea
    // but it fits the general spaghetti code here
    this.setState({task_ptr: this.state.prev_task_ptr + 1, question_ptr: 0, prev_task_ptr: this.state.prev_task_ptr + 1},
      ()=>{
        this.setState({question: this.getNextQuestion()}, this.setWaitTimer(__TIMING_DURATIONS__['questions']));
      }
    )
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
        // reached the end of the study
        this.setState({question_ptr: -1, task_ptr: -1, question: null, done: true},
          this.progressToNextStage);
    }
  }

  getNextQuestion() {
    // getNextQuestion works only with nice values
    if (this.state.questions.length > this.state.task_ptr && this.state.questions[this.state.task_ptr].length > this.state.question_ptr) {
      console.debug("found a question in task_ptr: " + this.state.task_ptr + " and q_ptr " + this.state.question_ptr + ", here look:");
      console.debug(this.state.questions[this.state.task_ptr][this.state.question_ptr]);
      return this.state.questions[this.state.task_ptr][this.state.question_ptr];
    } else {
      return null;
    }
  }

  progressToNextStage(){
    var current_stage = this.state.stage_id;
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
    var next_stage = current_stage + 1;

    this.clearTimers();

    console.log("progressing to next stage " + next_stage + " prev stage " + current_stage);

    this.setState({stage_id: next_stage, question: null, count_down: -1}, () => {
      if (next_stage < this.stages.length) {
        this.stages[next_stage](this.state.stage_id);
      } else {
        // done with everything
        console.log("done")
        this.setState({done: true});
      }
    });
  }

  setMusic(id){
    let audio_tag = document.getElementById('audio')
    if (id in __MUSIC__) {
      this.setState({music_url: "/songs/" + __MUSIC__[id]}, () => { audio_tag.load(); audio_tag.play() })
    } else {
      this.setState({music_url: ""}, () => audio_tag.pause())
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

  handleSelfChosenMusicSubmit(e) {
    let t = Object.keys(this.state.self_chosen_music)
    let all_good = t.slice(0, t.length - 1).reduce((acc, el) => acc && (value_ok(this.state.self_chosen_music[el]) && this.state.self_chosen_music[el].length > 0), true)

    if (all_good) {
      sendAdditionalData({user_id: this.state.user_id, data: this.state.self_chosen_music});
      this.setState({displaySelfChosenPage: false, error_with_self_chosen_music_data: false}, this.progressToNextStage)
    } else {
      this.setState({error_with_self_chosen_music_data: true})
    }


    e.preventDefault();
  }

  handleSelfChosenMusicChange(e) {
    let t = e.target;
    this.setState({self_chosen_music: {...this.state.self_chosen_music,
      [t.name]: t.value}});
  }

  handleUserIdChange(event) {
    this.setState({user_id: event.target.value});
  }

  handleMoodQuestionaire(values) {
    this.setState({
      mood_values: this.state.mood_values.concat([{timestamp: new Date().toLocaleString(), values: values}]),
      displayMoodQuestion: false
    }, ()=>{
      sendAdditionalData({user_id: this.state.user_id, data: this.state.mood_values});
      this.progressToNextStage();
    })
  }

  handleConvergentAnswerSubmission(answer) {
    this.setState({
      answers: this.state.answers.concat([[this.state.question.id, answer.id, new Date().toLocaleString()]]),
      value: ''
    },
      () => {
        this.progressPtrs();
        // otherwise the radio button stays activated
        document.getElementById("question-form").reset();
        sendAnswers(this.state.user_id, this.state.answers);
      }
    );
  }

  handleDivergentAnswerSubmission(answer) {
    this.setState({
      answers: this.state.answers.concat([[this.state.question.id, answer, new Date().toLocaleString()]]),
    }, () => {sendAnswers(this.state.user_id, this.state.answers)});
  }

  handleAdditionalUserData(event) {
    let t = event.target;
    this.setState({additional_user_data: {...this.state.additional_user_data,
      [t.name]: t.value}});
  }

  handleSubmitUserData(event) {
    let t = Object.keys(this.state.additional_user_data)
    let all_good = t.slice(0, t.length - 1).reduce((acc, el) => acc && value_ok(this.state.additional_user_data[el]), true)

    console.warn('turn this off!')
    // TODO turn this off!
    all_good = true
    this.setState({user_id: "1010", selectedLanguage: "fr"});

    this.setState({error_with_user_data: !all_good}, () => {
      if (this.state.user_id !== null
        && this.state.user_id !== ''
        && __LANGUAGES__.includes(this.state.selectedLanguage)
        && all_good) {
        sendAdditionalData({...this.state.additional_user_data, user_id: this.state.user_id});
        getQuestions(this.state.user_id, this.state.selectedLanguage).then(response => {
          console.log('got quetsions')
          console.log(response.data['questions'])
          this.setState({user_data_ok: true, questions: response.data['questions'], music_order: response.data['music_order']},
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
        onChange={this.handleConvergentAnswerSubmission}
        />;
    } else {
      q = <DivergentQuestion keyword={this.state.question.keyword}
        onSubmit={this.handleDivergentAnswerSubmission}
        />;
    }

    return (
      <div className="question">
        <div className="countDownTimer">
          { this.state.count_down >= 0 &&
            <p>{this.state.count_down} seconds to go</p>
          }
        </div>
        <div>{q}</div>
      </div>
    );
  }

  renderSelfChosenMusicPage(){
    return (
      <div>
        <p>Please select a song which you think will help you solve these problems the best.</p>
        <p>If you have selected the song and entered the information below, please click the button.</p>
        <p>Please enter the title and the artist below:</p>
        { this.state.error_with_self_chosen_music_data &&
          <p className="error_field">Some error with the form. Please fill it out completely.</p>
        }
        <div>
          <label>Artist</label>
          <input type="text" name='artist' value={this.state.self_chosen_music['artist']} onChange={this.handleSelfChosenMusicChange}/>
        </div>
        <div>
          <label>Title</label>
          <input type="text" name='title' value={this.state.self_chosen_music['title']} onChange={this.handleSelfChosenMusicChange}/>
        </div>
        <div>
          <label>Genre</label>
          <input type="text" name='genre' value={this.state.self_chosen_music['genre']} onChange={this.handleSelfChosenMusicChange}/>
        </div>
        <button className="submit_btn" type="submit" onClick={this.handleSelfChosenMusicSubmit}>Proceed</button>
      </div>
    )
  }

  renderWelcomePage(){
    return (
      <div className="welcome">
        <h1>Welcome to our little study!</h1>
        <p>It will take about 30 min of your time to complete this study.</p>
        <p>Please make sure that your headphones are plugged in. You should hear a song right now.</p>
        <p>The study will start as soon as you press submit. So make sure that you are ready.</p>
        <p>TODO DESCRIBE OUTLINE OF PROCEDURE</p>
        <p>Good luck!</p>
        <form className="form">
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
          <label className="label">Field of study / Profession</label>
          <input type="text" name="field_of_study" value={this.state.additional_user_data.field_of_study} onChange={this.handleAdditionalUserData}/ >
          <label className="label">Country of origin</label>
          <input type="text" name="country_of_origin" value={this.state.additional_user_data.country_of_origin} onChange={this.handleAdditionalUserData}/ >
          <label className="label">Mother tongue</label>
          <input type="text" name="monther_tongue" value={this.state.additional_user_data.monther_tongue} onChange={this.handleAdditionalUserData}/ >
          <label className="label">If you would like some feedback, please also enter your email</label>
          <input type="text" name="email" value={this.state.additional_user_data.email} onChange={this.handleAdditionalUserData}/ >
          <input className="submit_btn" type="submit" value="Submit"
              onClick={this.handleSubmitUserData} />
        </form>
      </div>
    );
  }

  render() {
    let body

    if (!this.state.done) {
      if (this.state.user_data_ok) {
        if (this.state.displaySelfChosenPage) {
          body = this.renderSelfChosenMusicPage();
        } else if (this.state.displayMoodQuestion) {
          body = <MoodQuestionaire onSubmit={this.handleMoodQuestionaire}/>;
        } else if (this.state.question === null) {
          body =  <RenderBreak count_down={this.state.count_down} music_url={this.state.music_url}/>;
        } else {
          body = this.renderQuestion();
        }
      } else {
        body =  this.renderWelcomePage();
      }
    } else {
      body = <RenderDone />;
    }

    return (
      <div className="App">
        <Music music_url={this.state.music_url} />
        {body}
      </div>
    )


  }
}

export default App;
