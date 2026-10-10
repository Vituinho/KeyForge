/** Only event identifiers and attempt evidence cross the reward boundary. Never totals/outcomes. */
export function validateProgressionRequest(input:Record<string,unknown>):void {
 const allowed:Record<string,string[]>={begin:['action','enemyId','language'],finish:['action','sessionId','events'],pvp:['action','matchId'],beginPractice:['action','kind','layout','language','targetKeys'],practice:['action','sessionId','rounds','targetKey']}
 const keys=typeof input.action==='string'?allowed[input.action]:undefined
 if(!keys||Object.keys(input).some(key=>!keys.includes(key))) throw new Error('Unexpected reward fields')
}
