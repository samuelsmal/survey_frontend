import React, { Component } from 'react';
import { Slider, Rail, Handles, Tracks } from 'react-compound-slider'
import { SliderRail, Handle, Track } from './sliderComponents'

const sliderStyle = {
  position: 'relative',
  width: '100%',
}

const domain = [0, 100]

function SetMoodValue(props) {
  return [
    <label className="label user_data">{props.name}</label>,
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
  ]
}

function getMoodDefaultValues() {
  return [
    {"mood_name": "relaxed", "mood_value": 50},
    {"mood_name": "tired", "mood_value": 50},
    {"mood_name": "happy", "mood_value": 50},
    {"mood_name": "energetic", "mood_value": 50},
    {"mood_name": "sad", "mood_value": 50}
  ];
}

export class MoodQuestionaire extends Component {
  constructor(props) {
    super(props);

    this.state = {
        mood_values: getMoodDefaultValues(),
        errorWithForm: false
    };

    this._onSubmit = props.onSubmit;
    this.onSubmit = this.onSubmit.bind(this);
    this.onValueChange = this.onValueChange.bind(this);
  };

  onSubmit(event) {
    this._onSubmit();

    event.preventDefault();
  }

  onValueChange(event) {
    let t = event.target;

    console.log("target");
    console.log(t);
  }

  render() {
    const moodValues = this.state.mood_values.map((d, i) =>
      <SetMoodValue value={d.mood_value}
        name={i} onChange={this.onValueChange}
        key={"mood_value_" + i}/>);

    return (
      <div>
        { this.state.errorWithForm &&
          <p className="error_field">Some error with the form. Please fill it out completely (except for the email address).</p>
        }
        <label className="label">How are you feeling right now? Left: Not at all, Right: very much so.</label>
        { moodValues }
        <button className="submit_btn" type="submit" value="Submit" onClick={this.onSubmit}>Proceed</button>
      </div>
    );
  }
}

export function ConvergenceQuestion(props) {
  // TODO add translation?
  return (
    <div className="convergence_question">
      <p>Select the most fitting answer following the given statement:</p>
      <label className="questionStatement"> {props.question} </label>
      { props.possibleAnswers.map(answer => {
        return (
          <div key={props.question.id + "_" + answer.id} >
            <input
              type="radio"
              value={answer.id}
              name={props.question.id}
              key={"input_" + props.question.id + "_" + answer.id}
              onClick={props.onChange}/>
            <span className="answer">{answer.answer}</span>
          </div>
        )})}
    </div>
  );
}

export function DivergentQuestion(props) {
  return <h1>lbub</h1>;
}

export function RenderBreak(props) {
    return (
      <div className="App">
        <Music music_url={props.music_url} />
        <p>Relax and take a break for {props.count_down} seconds until the next exercise</p>
      </div>
    );
}

export function RenderDone(props) {
    return (
      <div className="App">
        <p>All done! Thanks</p>
      </div>
    );
}

export function Music(props) {
  return (
    <audio autoPlay="autoplay" loop="True">
      <source src={process.env.PUBLIC_URL + props.music_url} />
    </audio>
  )
}

