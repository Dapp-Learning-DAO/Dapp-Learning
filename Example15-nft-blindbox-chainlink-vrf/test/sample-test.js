const { expect } = require("chai");
const { expectRevert, expectEvent } = require('@openzeppelin/test-helpers')

const RANDOM_SEED = 100
const CHARACTER_NAME = "Shrek"


//todo mock chainlink test env
describe('DungeonsAndDragonsCharacter', accounts => {
  const { LinkToken } = require('@chainlink/contracts/truffle/v0.4/LinkToken')
  const DungeonsAndDragonsCharacter = artifacts.require('DungeonsAndDragonsCharacter.sol')
  const defaultAccount = accounts[0]
  
  let link, dnd
  
  beforeEach(async () => {
    link = await LinkToken.new({ from: defaultAccount })
    dnd = await DungeonsAndDragonsCharacter.new({ from: defaultAccount })
  })
  
  describe('#requestNewRandomCharacter', () => {
    context('without LINK', () => {
      it('reverts', async () => {
        const newCharacter = await expectRevert.unspecified(dnd.requestNewRandomCharacter(RANDOM_SEED, CHARACTER_NAME))
      })
    })
  })
})
