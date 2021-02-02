export type WorkerState = {
    machineId : string,
    pubkey : string,
    state : {
        [label : string] : number
    },
    score : {
        overallScore : number,
        features : number[],
    },
    confidenceLevel: number,
    runtimeVersion: number,
}

export type StashInfo = {
    controller : string,
    payoutPrefs : {
        commission : number,
        target : string,
        confidenceLevel : number,
        runtimeVersion : number,
    }
}
