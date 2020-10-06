### Менеджер расписаний

Это модуль к основному серверу.

Обязательно указать в файле .env:

-   MOODLE_USER
-   MOODLE_PASS

##### Функции

-   update(courseExp, folderExp)
-   getFile(stgroup)
-   removeFavourite(id, stgroup)
-   getFavourites(id)
-   getLessons(stgroup, group - not required, today - not required)
-   getStgroup(stgroup - not required
-   getGroups(stgroup)
