import React, { useEffect, useState } from "react";
import "../static/main.css";
const Popup = () => {
    const [timerValues, setTimerValues] = React.useState({
        readTime: '00:00',
        breakTime: '00:00',
    })
    const [status, setStatus] = React.useState("stop");
    const [time,setTime]=useState({
        hours:0,
        minutes:0,
        seconds:0
    })
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log(request,"popup timer");
        setTime(request.data)
    })
    const getTimerDataFromLocalStorage = () => {
        chrome.runtime.sendMessage({ message: "get", data: timerValues }, (response) => {
            if(response.success===true){
                setTimerValues(response.data);
            }
        });
    }
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
    const handleStartTimer = (message: string) => {
        chrome.runtime.sendMessage({ message: message, data: timerValues }, (response) => {
            console.log(response);
        });
    }
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
            <div className="flex flex-1 mb-3 items-center">
                <h2 className="flex-1 text-center text-white text-xl">Break Timer</h2>
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
            <div className="mt-4 text-white text-xl flex flex-1 w-full justify-center">{time.hours<10?"0"+time.hours:time.hours}:{time.minutes<10?"0"+time.minutes:time.minutes}:{time.seconds<10?"0"+time.seconds:time.seconds}</div>
        </div>
    )
}

export default Popup;