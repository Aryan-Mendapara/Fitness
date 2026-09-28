(function () {
    var transitionKey = 'fitness-page-transition';

    function shouldReduceMotion() {
        return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    document.addEventListener('DOMContentLoaded', function () {
        if (sessionStorage.getItem(transitionKey)) {
            sessionStorage.removeItem(transitionKey);
            document.body.classList.add('page-entering');
        }

        document.querySelectorAll('.landing-enter, .welcome-page a[href="index.html"]').forEach(function (link) {
            link.addEventListener('click', function (event) {
                if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

                event.preventDefault();
                var destination = link.href;

                if (shouldReduceMotion()) {
                    window.location.href = destination;
                    return;
                }

                document.body.classList.add('page-leaving');
                sessionStorage.setItem(transitionKey, 'true');
                window.setTimeout(function () {
                    window.location.href = destination;
                }, 420);
            });
        });
    });
}());
