import React, { Component } from 'react';
import './App.css';
import TimerMixin from 'react-timer-mixin';
import {MoodQuestionaire, RenderBreak, ConvergenceQuestion, Music, RenderDone, DivergentQuestion} from './components';
import {__TIMING_DURATIONS__, __MUSIC__, __LANGUAGES__} from './constants';
import {sendAnswers, getQuestions, sendAdditionalData} from './api';


function value_ok(val){
  return (val !== '') // || (typeof(val) !== 'undefined')
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
        age: "",
        field_of_study: "",
        country_of_origin: "",
        mother_tongue: "",
        played_music_before: false,
        email: "" // this has to be last for the crappy validation
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
      error_with_self_chosen_music_data: false,
      displayExplanation: false,
      api_token: null
    };

    this.handleUserIdChange = this.handleUserIdChange.bind(this);
    this.handleConvergentAnswerSubmission = this.handleConvergentAnswerSubmission.bind(this);
    this.handleDivergentAnswerSubmission = this.handleDivergentAnswerSubmission.bind(this);
    this.handleSubmitUserData = this.handleSubmitUserData.bind(this);
    this.handleAdditionalUserData = this.handleAdditionalUserData.bind(this);
    this.handleMoodQuestionaire = this.handleMoodQuestionaire.bind(this);
    this.renderQuestionExplanation = this.renderQuestionExplanation.bind(this);
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
    this.allowMusic = this.allowMusic.bind(this);

    this.timeout = null;
    this.count_down = null;


    // the first stage is not listed here
    this.stages = [
      (stage_id)=> {
        this.setMusic(null);
        this.setState({displayExplanation: true})
      },
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
    //console.log("progressing to next stage " + next_stage + " prev stage " + current_stage);

    this.setState({stage_id: next_stage, question: null, count_down: -1}, () => {
      if (next_stage < this.stages.length) {
        this.stages[next_stage](this.state.stage_id);
      } else {
        // done with everything
        //console.log("done")
        this.setState({done: true});
      }
    });
  }

  allowMusic() {
    if (this.state.music_url) {
      let audio_tag = document.getElementById('audio')
      audio_tag.play().catch(error => {
        console.log('well... shit ... give this to sam: browser, platform and this: music should be allowed now')
      }).then(() => {
        // nothging
      })
    }
  }

  setMusic(id){
    let audio_tag = document.getElementById('audio')
    if (id in __MUSIC__) {
      this.setState({music_url: "/songs/" + __MUSIC__[id]}, () => { 
        audio_tag.load();
        audio_tag.play().catch(error => {
          console.log('well... shit ... give this to sam: browser, platform and this: ' + id)
        }).then(() => {
          // nothging
        })
      })
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
    this.setState({api_token: + new Date()});
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
    let all_good = t.reduce((acc, el) => acc && (value_ok(this.state.self_chosen_music[el]) && this.state.self_chosen_music[el].length > 0), true)

    if (all_good) {
      sendAdditionalData(this.state.api_token, {user_id: this.state.user_id, data: this.state.self_chosen_music});
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
      mood_values: this.state.mood_values.concat([{timestamp: + new Date(), values: values}]),
      displayMoodQuestion: false
    }, ()=>{
      sendAdditionalData(this.state.api_token, {user_id: this.state.user_id, data: this.state.mood_values});
      this.progressToNextStage();
    })
  }

  handleConvergentAnswerSubmission(answer) {
    const payload = [this.state.question.id, answer.id, + new Date()]
    this.setState({
      answers: this.state.answers.concat([payload]),
      value: ''
    },
      () => {
        this.progressPtrs();
        // otherwise the radio button stays activated
        document.getElementById("question-form").reset();
        sendAnswers(this.state.api_token, this.state.user_id, payload);
      }
    );
  }

  handleDivergentAnswerSubmission(answer) {
    const payload = [this.state.question.id, answer, + new Date()]
    this.setState({
      answers: this.state.answers.concat([payload]),
    }, () => {sendAnswers(this.state.api_token, this.state.user_id, payload)});
  }

  handleAdditionalUserData(event) {
    const t = event.target;
    const v = t.type === 'checkbox' ? t.checked : t.value;

    this.setState({additional_user_data: {...this.state.additional_user_data,
      [t.name]: v}});
  }

  handleSubmitUserData(event) {
    this.allowMusic()
    let t = Object.keys(this.state.additional_user_data)
    // the last value, which is email can be empty, and the "has played music before" as well
    let all_good = t.filter(attr => attr !== 'email').reduce((acc, el) => acc && value_ok(this.state.additional_user_data[el]), true)

    console.log("here ins submit")
    console.log(all_good)

    //console.warn('turn this off!')
    // TODO turn this off!
    //all_good = true
    //this.setState({user_id: "1010", selectedLanguage: "fr"});

    this.setState({error_with_user_data: !all_good}, () => {
      if (this.state.user_id !== null
        && this.state.user_id !== ''
        && __LANGUAGES__.includes(this.state.selectedLanguage)
        && all_good) {
        sendAdditionalData(this.state.api_token, {...this.state.additional_user_data, user_id: this.state.user_id});
        getQuestions(this.state.api_token,
                     this.state.user_id,
                     this.state.selectedLanguage).then(response => {
          this.setState({user_data_ok: true,
                         questions: response.data['questions'],
                         music_order: response.data['music_order']},
                        this.progressToNextStage);
        }).catch(error => {
          this.setState({error_with_user_data: true})
        });
      }
    })

    event.preventDefault();
  }

  handleLanguageSelection(event) {
    this.setState({selectedLanguage: event.target.value});
  }

  renderQuestionExplanation() {
    let q;

    if (this.state.selectedLanguage === 'fr') {
      q = (
        <div>
          <p>Il y a deux types de tâches.</p>
          <p>Dans la première choisissez, parmi les possibilités données, le couple de mots qui suit ou remplit la même logique que la paire dans la donnée. Pour la deuxième, citez un maximum de façons d'utiliser l'objet suivant. Par exemple pour un "Verre" : boire, pot, dessiner un cercle ...</p>
          <button className="submit_btn" type="submit" onClick={()=> {this.setState({displayExplanation: false}, this.progressToNextStage)}}>Proceed</button>
        </div>
      )
    } else {
      q = (
        <div>
          <p>Ci sono due tipi di esercizi.</p>
          <p>Il primo consiste in delle analogie verbali, in cui bisogna trovare la coppia di parole che segue la stessa logica di quella data.</p>
          <p>Nel secondo esercizio, dovete trovare il maggior numero di utilizzi possibili per un dato oggetto. Per esempio per la parola “bicchiere” delle possibili risposte sarebbero: bere, vaso, disegnare un cerchio ...</p>
          <button className="submit_btn" type="submit" onClick={()=> {this.setState({displayExplanation: false}, this.progressToNextStage)}}>Proceed</button>
        </div>
      )
    }

    return q;
  }

  renderQuestion() {
    let q;
    if (this.state.question && this.state.question.id.includes('ct')) {
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
        <p>Make sure that the song is playing before you continue.</p>
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
        <p>Please make sure that your headphones are plugged in. You should
          hear a song right now. If not press <input type="submit" value="here"
            onClick={this.allowMusic} /> , if you still can't hear any music
            please try it on a different browser / machine. </p>
        <p>The study will start as soon as you press submit. So make sure that you are ready.</p>
        <p>You will have to perform two different types of task while listening to music.
          The first task is of multiple choice type; click on the words or on the round
          bullet point to select your answer. Be careful you have only one
          chance to click! Once you have clicked on a solution, the program
          will take you to the next question.
          </p>
          <p>For the second task, you are asked to type in your answers, do so
            in the field that is dedicated for this purpose and press enter to
            submit your answer.</p>
          <p>In between the tasks, you have breaks to relax
            and a small questionnaire to fill in.
          </p>
          <p>At the end, you have the choose your own song. Play it on a platform outside of
      our study (for ex. Spotify or Youtube), come back to the window
      displaying our study and give us the required information about the
          music (just the title, artist and genre). Play it on repeat until the end of the experiment, but select and play the music when we tell you.
          </p>
        <p>Good luck!</p>
        <form className="form">
          { this.state.error_with_user_data &&
              <p className="error_field">Some error with the form. Please fill it out completely (except for the email address).</p>
          }
          <label className="label">Please enter the given code from your sheet of paper.</label>
          <input className="text" type="textarea" value={this.state.user_id} name="user_id" onChange={this.handleUserIdChange}/>
          <label className="label">Select your preferred language.</label>
          <select value={this.state.selectedLanguage} name="language" onChange={this.handleLanguageSelection}>
            <option value="">select one</option>
            <option value="it">Italiano</option>
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
          <input type="number"
            name="age"
            min="0"
            value={this.state.additional_user_data.age}
            style={{margin: '0 auto'}}
            onChange={this.handleAdditionalUserData} />
          <label className="label">Field of study / Profession</label>
          <input type="text"
            name="field_of_study"
            value={this.state.additional_user_data.field_of_study}
            onChange={this.handleAdditionalUserData}/ >
          <label className="label">Country of origin</label>
          <input type="text"
            name="country_of_origin"
            value={this.state.additional_user_data.country_of_origin}
            onChange={this.handleAdditionalUserData}/ >
          <label className="label">Mother tongue</label>
          <input type="text"
            name="mother_tongue"
            value={this.state.additional_user_data.mother_tongue}
            onChange={this.handleAdditionalUserData}/ >
          <label className="label">Do you play an instrument?</label>
          <input type="checkbox"
            name="played_music_before"
            value={this.state.additional_user_data.played_music_before}
            onChange={this.handleAdditionalUserData}/ >
          <label className="label">If you would like some feedback, please also enter your email</label>
          <input type="text"
            name="email"
            value={this.state.additional_user_data.email}
            onChange={this.handleAdditionalUserData}/ >
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
        if (this.state.displayExplanation) {
          body = this.renderQuestionExplanation();
        } else if (this.state.displaySelfChosenPage) {
          body = this.renderSelfChosenMusicPage();
        } else if (this.state.displayMoodQuestion) {
          body = <MoodQuestionaire
            onSubmit={this.handleMoodQuestionaire}
            getMusicGoing={this.allowMusic}/>;
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
