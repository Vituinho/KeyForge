import test from 'node:test'
import assert from 'node:assert/strict'
import { validateProgressionRequest } from './progressionRequest'
test('reward APIs reject forged XP, rank, completion, inventory and match outcomes',()=>{
 for(const action of ['begin','finish','pvp','beginPractice','practice']) for(const field of ['xp','level','rank','forge_shards','cosmetics','completedStages','winner_id','victory','userId','wpm','accuracy','combo','lessonId']) {
  assert.throws(()=>validateProgressionRequest({action,[field]:99999}))
 }
 for(const input of [{action:'begin',enemyId:'naruto',language:'en'},{action:'finish',sessionId:'id',events:[]},{action:'pvp',matchId:'id'}]) assert.doesNotThrow(()=>validateProgressionRequest(input))
 assert.throws(()=>validateProgressionRequest({action:'import',profile:{xp:99999}}))
})
