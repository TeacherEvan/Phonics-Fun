@echo off
echo Starting Phonics Fun Game...
echo.
echo Choose an option:
echo 1. Open in default browser
echo 2. Start local server (Python required)
echo 3. Start local server (Node.js required)
echo 4. Run tests
echo 5. Build Docker image
echo 6. Run Docker container
echo 7. Run Asset Generator
echo 8. Run Sound Generator
echo 9. Exit
echo.
set /p choice=Enter your choice (1-9): 

if %choice%==1 (
    echo Opening in default browser...
    start index.html
) else if %choice%==2 (
    echo Starting Python server...
    python -m http.server 8000
    echo.
    echo Server running at http://localhost:8000
    echo Press Ctrl+C to stop the server.
) else if %choice%==3 (
    echo Starting Node.js server...
    if exist node_modules\http-server\bin\http-server (
        node node_modules\http-server\bin\http-server -p 8080 -c-1 --cors
    ) else (
        echo Installing http-server...
        npm install http-server --no-save
        node node_modules\http-server\bin\http-server -p 8080 -c-1 --cors
    )
    echo.
    echo Server running at http://localhost:8080
    echo Press Ctrl+C to stop the server.
) else if %choice%==4 (
    echo Running tests...
    start Tests\test-suite.html
) else if %choice%==5 (
    echo Building Docker image...
    docker build -t phonics-fun-game .
    echo.
    echo Docker image built successfully.
    echo Run option 6 to start the container.
) else if %choice%==6 (
    echo Running Docker container...
    docker run -d -p 8090:80 --name phonics-fun-game phonics-fun-game
    echo.
    echo Container running at http://localhost:8090
    echo To stop the container, run: docker stop phonics-fun-game
) else if %choice%==7 (
    echo Running Asset Generator...
    start Tests\asset-generator.html
) else if %choice%==8 (
    echo Running Sound Generator...
    start Tests\audio-generator.html
) else if %choice%==9 (
    echo Exiting...
    exit
) else (
    echo Invalid choice. Please try again.
    goto :eof
)

echo.
echo Done!
) else if %choice%==3 (
    echo Starting Node.js server...
    npx http-server -p 8000
) else if %choice%==4 (
    echo Opening test suite...
    start Tests\test-suite.html
) else if %choice%==5 (
    echo Goodbye!
    exit
) else (
    echo Invalid choice. Please try again.
    pause
    goto :start
)

pause
