const elem = document.querySelector('span.like');

const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        if (mutation.type === 'attributes') {
            const target = mutation.target
            const className = target.className;
            console.log(className)
            if (className === 'like') {
                setTimeout(() => target.click(), 1000);
                console.log('Clicked!')
            }
        }
    })
})

const config = {
    attributes: true,
    attributesFilter: ['class']
};


observer.observe(elem, config);


document.addEventListener('DOMContentLoaded', () => console.log('DOMContentLoaded!!!!'))