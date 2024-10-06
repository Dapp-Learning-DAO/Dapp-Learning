
//返回一个tracer，其例子用于追踪指sstore的数目
function createTracer() {
    return {
        opCount:0,
        //每一步opcode的执行都出现。
        step(log, db) {
            if (log.op.toString() == 'SSTORE'){
                this.opCount++;
            }
        },
        //返回tracer结果，最终作为traceXXX的输出
        result(ctx, db) {
            return {"count": this.opCount}
        },
        //报错时调用
        fault(log, db) {
            
        },
        //进入一个callframe，在内部调用时出现，包括call，create，selfdestruct等
        enter(callFrame) {
            this.callCount++;
        },
        //退出一个callframe
        exit(frameResult) {
        
        }
    }
}


module.exports = {
    createTracer
}