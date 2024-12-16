import React from "react";
import "../static/main.css";
const Popup = () => {
    return (
        <div className="bg-slate-400 rounded-md w-40 h-40">
            <div className="flex flex-1">
                <h4 className="flex-1 text-center">Break Timer</h4>
                <img src={"../assets/resources/resetIcon.png"} alt="reset" className="w-4 h-4"/>
            </div>
            <div>
                <div>
                    <input type="time" id="time" name="time" />
                    <label >Read Time</label>
                </div>
                <div>
                    <input type="time" id="time" name="time" />
                    <label >Break Time</label>
                </div>
            </div>
            <div>
                <button>Start</button>
                <button>Stop</button>
            </div>
        </div>
    )
}

export default Popup;