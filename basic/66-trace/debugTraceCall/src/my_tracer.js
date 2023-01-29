
//返回一个tracer，其例子用于追踪指sstore的数目
function createTracer() {
    return {
        opCount:0,
        
        step(log, db) {
            if (log.op.toString() == 'SSTORE'){
                this.opCount++;
            }
        },
        
        result(ctx, db) {
            return {"count": this.opCount}
        },
        
        fault(log, db) {
            
        },
        
        enter(callFrame) {
            this.callCount++;
        },
        exit(frameResult) {
        
        }
    }
}


module.exports = {
    createTracer
}