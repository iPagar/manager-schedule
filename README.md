### Менеджер расписаний

Это модуль к основному серверу.

Обязательно указать в файле .env:

-   MOODLE_USER
-   MOODLE_PASS

##### Функции

-   update()
-   getFile(stgroup)
-   insertFavourite(id, stgroups)
-   removeFavourite(id, stgroups)
-   getFavourites(id)
-   getLessons(stgroup, group - not required, today - not required)
-   getStgroup(stgroup - not required)
