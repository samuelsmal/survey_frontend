import React, { Component } from 'react';
import { Slider, Rail, Handles, Tracks } from 'react-compound-slider'
import { SliderRail, Handle, Track } from './sliderComponents'

const sliderStyle = {
  position: 'relative',
  width: '100%',
}

const moodSliderLabelStyle =  {
  display: 'block',
  padding: '15px',
  textAlign: 'center',
}

const domain = [0, 100]

function SetMoodValue(props) {
  return (
    <React.Fragment>
    <label style={moodSliderLabelStyle}>{props.name}</label>
    <Slider
          mode={1}
          step={0.001}
          domain={domain}
          rootStyle={sliderStyle}
          onChange={props.onChange}
          values={[props.value]}
        >
          <Rail>
            {({ getRailProps }) => <SliderRail getRailProps={getRailProps} />}
          </Rail>
          <Handles>
            {({ handles, getHandleProps }) => (
              <div className="slider-handles">
                {handles.map(handle => (
                  <Handle
                    key={handle.id}
                    handle={handle}
                    domain={domain}
                    getHandleProps={getHandleProps}
                  />
                ))}
              </div>
            )}
          </Handles>
          <Tracks right={false}>
            {({ tracks, getTrackProps }) => (
              <div className="slider-tracks">
                {tracks.map(({ id, source, target }) => (
                  <Track
                    key={id}
                    source={source}
                    target={target}
                    getTrackProps={getTrackProps}
                  />
                ))}
              </div>
            )}
          </Tracks>
        </Slider>
      </React.Fragment>
  );
}

const moodQuestionnaireStyle = {
  maxWidth: '400px',
  margin: '0 auto',
}

function getMoodDefaultValues() {
  // it's easier to loop over...
  // I know that this works for certain
  return {
    relaxed: 50,
    tired: 50,
    happy: 50,
    energetic: 50,
    sad: 50
  }
}

export class MoodQuestionaire extends Component {
  constructor(props) {
    super(props);

    this.state = {
        mood_values: getMoodDefaultValues(),
        errorWithForm: false
    };

    this._onSubmit = props.onSubmit;
    this._getMusicGoing = props.getMusicGoing;
    this.onSubmit = this.onSubmit.bind(this);
    this.onValueChange = this.onValueChange.bind(this);
  };

  onSubmit(event) {
    this._getMusicGoing();
    this._onSubmit(this.state.mood_values);

    event.preventDefault();
  }

  onValueChange(mood_name, val) {
    this.setState({mood_values: {...this.state.mood_values, [mood_name]: val[0]}})
  }

  render() {
    const moodValues = Object.entries(this.state.mood_values).map((el, i) =>
      {
        return <SetMoodValue value={el[1]}
          name={el[0]} onChange={(val) => {this.onValueChange(el[0], val)}}
          key={"mood_" + el[0]}/>
      })

    return (
      <div style={moodQuestionnaireStyle}>
        { this.state.errorWithForm &&
          <p className="error_field">Some error with the form. Please fill it out completely (except for the email address).</p>
        }
        <label className="label">
          How are you feeling <em>right now</em>? 
          Left: Not at all (total disagreement), Right: very much so (total agreement).
        </label>
        { moodValues }
      <button className="submit_btn" type="submit" value="Submit" onClick={this.onSubmit}>Proceed</button>
      </div>
    );
  }
}

export function ConvergenceQuestion(props) {
  // TODO add translation?
  return (
    <form className="convergence_question" id="question-form">
      <p>Select the most fitting answer following the given statement:</p>
      <label className="questionStatement"> {props.question} </label>
      { props.possibleAnswers.map(answer => {
        return (
          <div key={props.question.id + "_" + answer.id} onClick={() => props.onChange(answer)} >
            <input
              type="radio"
              value={answer.id}
              name={props.question.id}
              key={"input_" + props.question.id + "_" + answer.id}
              onClick={(e) => { props.onChange(answer); e.preventDefault()}}
              />
            <span className="answer">{answer.answer}</span>
          </div>
        )})}
    </form>
  );
}

export class DivergentQuestion extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      value: '',
      keyword: props.keyword
    };

    this.onSubmit = props.onSubmit;
  }

  _handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (this.state.value.length > 0) {
        this.onSubmit(this.state.value)
        this.setState({value: ''})
        e.preventDefault()
      }
    }
  }

  handleChange = (e) => {
    this.setState({value: e.target.value});
  }

  render() {
    return (
      <div className="divergent_question">
        <p>Write down as many uses as you can think of for the following object:</p>
        <p className="keyword">{this.state.keyword}</p>
        <p className="instruction">Press enter if you want to submit a response (do it after each word)</p>
        <input type="text" onKeyPress={this._handleKeyPress} value={this.state.value} onChange={this.handleChange}/>
      </div>
    )
  }
}


export function RenderBreak(props) {
    return (
      <p>Relax and take a break for {props.count_down} seconds until the next exercise</p>
    );
}

export function RenderDone(props) {
    return (
      <p>All done! Thanks</p>
    );
}

export function Music(props) {
  return (
    <audio autoPlay="autoplay" loop="True" id="audio">
      <source src={process.env.PUBLIC_URL + props.music_url} type="audio/mp3" />
    </audio>
  )
}

