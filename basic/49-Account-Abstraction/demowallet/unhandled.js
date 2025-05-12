

async function main() {
        const promise = new Promise((resolve, reject) => {
            setTimeout(() => {
            //   resolve();
               reject(new Error('Expected rejection.'));
            }, 2000);
          });
    
          promise.then((val, err)=>{
            console.log(err);
          })

          return 10;
}

p = main()
p.then();