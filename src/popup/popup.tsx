import React, { useEffect, useState } from "react";
import "../static/main.css";
/**
 * The main component for the popup.
 * 
 * This component renders a popup which displays the current time, input fields
 * for the read time and break time, buttons to start, stop and reset the timer.
 * 
 * It also handles the logic for starting, stopping and resetting the timer, and
 * updating the stored timer values in local storage.
 */
const Popup = () => {
    const [timerValues, setTimerValues] = React.useState({
        readTime: '00:00',
        breakTime: '00:00',
    })
    const [time,setTime]=useState({
        hours:0,
        minutes:0,
        seconds:0
    })
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if(request.message=="timer"){
        console.log(request,"popup timer");
        setTime(request.data)
        }
    })
    /**
     * Retrieves the stored timer values from local storage and updates
     * the component state with the stored values.
     * 
     * This function is used to retrieve the stored timer values from local
     * storage when the popup is opened. It sends a message to the background
     * script with the message type "get" and the component state as the
     * payload. The background script then retrieves the stored values from
     * local storage and sends them back to the popup in the response. If the
     * response is successful, the component state is updated with the stored
     * values.
     */
    const getTimerDataFromLocalStorage = () => {
        chrome.runtime.sendMessage({ message: "get", data: timerValues }, (response) => {
            if(response.success===true){
                setTimerValues(response.data);
            }
        });
    }
    /**
     * Retrieves the stored stop timer values from local storage and updates
     * the component state with the stored values.
     */
    const getStopTimerDataFromLocalStorage = () => {
        chrome.runtime.sendMessage({ message: "getStop" }, (response) => {
            if(response.success===true){
               setTime(
                response.data
               )
            }
        });
    }
    useEffect(() => {
        getTimerDataFromLocalStorage() 
        getStopTimerDataFromLocalStorage()
    },[])
    /**
     * Sends a message to the background script to start or stop the timer based
     * on the message parameter.
     * @param {string} message - The message to be sent to the background script. Should be
     * either "start" or "stop".
     */
    const handleStartTimer = (message: string) => {
        chrome.runtime.sendMessage({ message: message, data: timerValues }, (response) => {
            console.log(response);
        });
    }
    /**
     * Resets the timer, break timer and the input fields in the popup
     * to their initial state.
     */
    const handleResetTimer = () => {
        chrome.runtime.sendMessage({ message: "reset" }, (response) => {
            console.log(response);
            setTime({
                hours:0,
                minutes:0,
                seconds:0   
            })
            setTimerValues({
                readTime: '00:00',
                breakTime: '00:00',
            })
        });
    }
    return (
        <div className="bg-gray-800 w-52 h-full p-2">
            <div className="flex flex-1 items-center mt-2 mb-3.5">
                <p className=" text-white text-xl flex flex-1 w-full justify-center">{time.hours<10?"0"+time.hours:time.hours}:{time.minutes<10?"0"+time.minutes:time.minutes}:{time.seconds<10?"0"+time.seconds:time.seconds}</p>
                <img src="../assets/resource/resetIcon.png" alt="reset" className="w-4 h-4 cursor-pointer rounded-lg" onClick={handleResetTimer} />
            </div>
            <div className="flex flex-col justify-center items-center gap-2">
                <div className="flex gap-2 w-full">
                    <label className="text-white font-mono flex-1 self-start ">Read Time: </label>
                    <input type="time" id="readTime" name="readTime" value={timerValues.readTime} min="00:00" max="59:59" step="1" className="flex-1 self-start " onChange={(e) => {
                        console.log(e.target.value, "start time");
                        setTimerValues({ ...timerValues, readTime: e.target.value })
                    }} />
                </div>
                <div className="flex gap-2 w-full">
                    <label className="text-white font-mono flex-1 self-start ">Break Time: </label>
                    <input type="time" id="breakTime" name="breakTime" value={timerValues.breakTime}
                        min="0:00" max="59:59" step="1" className="flex-1 self-start " onChange={(e) => {
                            setTimerValues({ ...timerValues, breakTime: e.target.value })
                        }} />
                </div>
            </div>
            <div className="flex gap-2 my-2">
                <button className={`${time.hours==0&&time.minutes==0&&time.seconds==0?"bg-green-500 ":"bg-yellow-300 "}rounded-md border-transparent border-[1px] shadow-md h-8 w-full`} onClick={()=>handleStartTimer(time.hours==0&&time.minutes==0&&time.seconds==0?"start":"resume")}>{time.hours==0&&time.minutes==0&&time.seconds==0?"Start":"Resume"}</button>
                <button className=" bg-red-500 rounded-md border-transparent border-[1px] shadow-md h-8 w-full" onClick={()=>handleStartTimer("stop")}>Stop</button>
            </div>
          
        </div>
    )
}

export default Popup;