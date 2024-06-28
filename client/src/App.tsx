import React, {useEffect, useState} from "react";
import {DatabaseType} from "./types";

const API_URL = "http://localhost:8080";

async function sha256(message: string): Promise<string> {
    // encode as UTF-8
    const msgBuffer = new TextEncoder().encode(message);

    // hash the message
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

    // convert ArrayBuffer to Array
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    // convert bytes to hex string
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}


function App() {
    const [data, setData] = useState<string>();

    useEffect(() => {
        getData();
    }, []);

    const fetchData = async (): Promise<DatabaseType> => {
        const response = await fetch(API_URL);
        return await response.json();
    }

    const getData = async () => {
        const {data} = await fetchData()
        setData(data);
    };

    const updateData = async () => {
        await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({data, hash: await sha256(verifyData.toString())}),
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
        });

        await getData();
    };

    const verifyData = async () => {
        const fetchedData = await fetchData()
        const computedHash = await sha256(fetchedData.data)
        if (computedHash !== fetchedData.hash) {
            console.error('DATA INTEGRITY VIOLATED')
            throw new Error('Compromised')
        }

        const serverValidationResponse = await fetch(`${API_URL}/verify`, {
            method: "POST",
            body: JSON.stringify({signature: await sha256(verifyData.toString())}),
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
        })

        if (serverValidationResponse.status !== 200) {
            throw new Error('Compromised')
        }

        console.log('Data integrity confirmed')

    };

    return (
        <div
            style={{
                width: "100vw",
                height: "100vh",
                display: "flex",
                position: "absolute",
                padding: 0,
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "column",
                gap: "20px",
                fontSize: "30px",
            }}
        >
            <div>Saved Data</div>
            <input
                style={{fontSize: "30px"}}
                type="text"
                value={data}
                onChange={(e) => setData(e.target.value)}
            />

            <div style={{display: "flex", gap: "10px"}}>
                <button style={{fontSize: "20px"}} onClick={updateData}>
                    Update Data
                </button>
                <button style={{fontSize: "20px"}} onClick={verifyData}>
                    Verify Data
                </button>
            </div>
        </div>
    );
}

export default App;
