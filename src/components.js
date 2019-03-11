import React from 'react';

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
