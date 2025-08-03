import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Button,
  TextField,
  MenuItem,
  Typography,
  Paper,
  Tabs,
  Tab,
  Box,
  IconButton,
  Divider,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { keyframes } from "@mui/system";
import { useWebSocket } from "../context/WebSocketContext";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const subtleGlow = keyframes`
  0%, 100% { opacity: 0.9; }
  50% { opacity: 1; }
`;

const defaultYears = ["9th Grade", "10th Grade", "11th Grade", "12th Grade"];

const semesterToGrade = (year, semester) => {
  const currentYear = 2025;
  const yearDiff = currentYear - parseInt(year);
  if (
    semester.toLowerCase() === "fall" ||
    semester.toLowerCase() === "spring"
  ) {
    if (yearDiff === 0) return "12th Grade";
    if (yearDiff === 1) return "11th Grade";
    if (yearDiff === 2) return "10th Grade";
    if (yearDiff === 3) return "9th Grade";
  }
  return "12th Grade";
};

export default function FourYearPlanner() {
  const [plans, setPlans] = useState([]);
  const [activePlanIndex, setActivePlanIndex] = useState(0);
  const [newCourse, setNewCourse] = useState({
    year: "9th Grade",
    name: "",
    credits: 1,
  });
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState("");

  // WebSocket vars
  const { socket, isConnected } = useWebSocket();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [username, setUsername] = useState("");

  const [user, setUser] = useState(null);

  const backendUrl =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

  useEffect(() => {
    fetch(`${backendUrl}/me`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch user");
        return res.json();
      })
      .then((data) => {
        setUser(data.user);
      })
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const counselorMode = urlParams.get("counselorMode") === "true";
    const studentId = urlParams.get("studentId");

    setUsername(counselorMode ? "Counselor" : "Student");

    if (socket && isConnected) {
      const roomData = {
        type: "join-student-room",
        data: {
          studentId: studentId,
          userId: counselorMode ? "counselor@example.com" : studentId,
          userType: counselorMode ? "counselor" : "student",
        },
      };
      socket.send(JSON.stringify(roomData));

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: `You joined room for student: ${studentId}`,
          sender: "System",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }
  }, [socket, isConnected]);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "chat-message":
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now(),
                text: data.message || event.data,
                sender: data.sender || "Server",
                timestamp: new Date().toLocaleTimeString(),
              },
            ]);
            break;
          case "plans-update":
            if (data.sender !== username) {
              setPlans(data.plans);
            }
            break;
          case "comments-update":
            if (data.sender !== username) {
              setComments(data.comments);
            }
            break;
          default:
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now(),
                text: data.message || event.data,
                sender: data.sender || "Server",
                timestamp: new Date().toLocaleTimeString(),
              },
            ]);
        }
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            text: event.data,
            sender: "Server",
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      }
    };

    socket.addEventListener("message", handleMessage);

    return () => {
      socket.removeEventListener("message", handleMessage);
    };
  }, [socket]);

  const sendMessage = () => {
    if (!socket || !isConnected || !inputMessage.trim()) return;

    const messageData = {
      type: "chat-message",
      message: inputMessage,
      sender: username,
      timestamp: new Date().toISOString(),
    };

    socket.send(JSON.stringify(messageData));

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        text: inputMessage,
        sender: `${username} (me)`,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);

    setInputMessage("");
  };

  const sendPlansUpdate = (updatedPlans) => {
    if (!socket || !isConnected) return;
    const messageData = {
      type: "plans-update",
      plans: updatedPlans,
      sender: username,
    };
    socket.send(JSON.stringify(messageData));
  };

  const sendCommentsUpdate = (updatedComments) => {
    if (!socket || !isConnected) return;
    const messageData = {
      type: "comments-update",
      comments: updatedComments,
      sender: username,
    };
    socket.send(JSON.stringify(messageData));
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const counselorMode = urlParams.get("counselorMode") === "true";
    const studentId = urlParams.get("studentId");
    const endpoint = counselorMode ? "admin/plans" : "plans";

    fetch(`${backendUrl}/api/${endpoint}`, {
      credentials: "include",
      headers: { "student-email": studentId },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch plans");
        return res.json();
      })
      .then((plansData) => {
        if (plansData.length === 0) {
          setPlans([]);
          sendPlansUpdate(plans);
          return;
        }

        Promise.all(
          plansData.map((plan) =>
            fetch(`${backendUrl}/api/plans/${plan.id}`, {
              credentials: "include",
            })
              .then((r) => r.json())
              .then((courses) => {
                const yearsGrouped = {
                  "9th Grade": [],
                  "10th Grade": [],
                  "11th Grade": [],
                  "12th Grade": [],
                };
                courses.forEach(({ class_code, year }) => {
                  if (yearsGrouped[year]) {
                    yearsGrouped[year].push(class_code);
                  } else {
                    yearsGrouped["9th Grade"].push(class_code);
                  }
                });
                return { ...plan, years: yearsGrouped };
              })
          )
        ).then((plansWithCourses) => {
          setPlans(plansWithCourses);
          sendPlansUpdate(plansWithCourses);

          plansWithCourses.forEach((plan) => {
            fetch(`${backendUrl}/api/plans/${plan.id}/comments`, {
              credentials: "include",
            })
              .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch comments");
                return res.json();
              })
              .then((commentsData) => {
                setComments((prev) => ({ ...prev, [plan.id]: commentsData }));
                sendCommentsUpdate(comments);
              })
              .catch(() => {
                setComments((prev) => ({ ...prev, [plan.id]: [] }));
              });
          });
        });
      })
      .catch(console.error);
  }, []);

  const fetchComments = (planId) => {
    fetch(`${backendUrl}/api/plans/${planId}/comments`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setComments((prev) => ({ ...prev, [planId]: data }));
        sendCommentsUpdate(comments);
      });
  };

  const handleAddComment = () => {
    const planId = plans[activePlanIndex]?.id;
    if (!planId || !newComment.trim()) return;

    fetch(`${backendUrl}/api/plans/${planId}/comments`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newComment.trim() }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to post comment");
        setNewComment("");
        fetchComments(planId);
      })
      .catch(console.error);
  };

  const handleAddCourse = () => {
    if (!newCourse.name.trim()) return;
    const updatedPlans = [...plans];
    updatedPlans[activePlanIndex].years[newCourse.year].push(
      newCourse.name.trim()
    );
    setPlans(updatedPlans);
    sendPlansUpdate(updatedPlans);
    setNewCourse({ ...newCourse, name: "" });
  };

  const flattenCourses = (yearsObj) => {
    const courses = [];
    for (const [year, classes] of Object.entries(yearsObj)) {
      classes.forEach((class_code) => {
        courses.push({
          class_code,
          year,
          semester: "fall",
        });
      });
    }
    return courses;
  };

  const handleSaveCourses = () => {
    const activePlan = plans[activePlanIndex];
    const coursesFlat = flattenCourses(activePlan.years);

    if (!activePlan.id) {
      fetch(`${backendUrl}/api/plans`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: activePlan.name, courses: coursesFlat }),
      })
        .then((res) => res.json())
        .then(({ planId }) => {
          const updatedPlans = [...plans];
          updatedPlans[activePlanIndex].id = planId;
          setPlans(updatedPlans);
          sendPlansUpdate(updatedPlans);
          alert("Plan created successfully");
        })
        .catch(console.error);
    } else {
      const urlParams = new URLSearchParams(window.location.search);
      const counselorMode = urlParams.get("counselorMode") === "true";
      const studentId = urlParams.get("studentId");
      const endpoint = counselorMode ? "admin/" : "";
      fetch(`${backendUrl}/api/${endpoint}plans/${activePlan.id}/courses`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "student-email": studentId,
        },
        body: JSON.stringify({ courses: coursesFlat, name: activePlan.name }),
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to update plan courses");
          alert("Courses updated successfully");
        })
        .catch((err) => {
          alert(err.message);
        });
    }
  };

  const handleDeletePlan = () => {
    const activePlan = plans[activePlanIndex];
    if (!activePlan.id) {
      alert("Plan not saved yet");
      return;
    }
    const urlParams = new URLSearchParams(window.location.search);
    const counselorMode = urlParams.get("counselorMode") === "true";
    const studentId = urlParams.get("studentId");
    const endpoint = counselorMode ? "admin/" : "";
    fetch(`${backendUrl}/api/${endpoint}plans/${activePlan.id}`, {
      method: "DELETE",
      credentials: "include",
      headers: { "student-email": studentId },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to delete plan");
        const updatedPlans = plans.filter((_, i) => i !== activePlanIndex);
        setPlans(updatedPlans);
        sendPlansUpdate(updatedPlans);
        setActivePlanIndex(Math.max(0, activePlanIndex - 1));
        alert("Plan deleted");
      })
      .catch(console.error);
  };

  const handleNameChange = (e) => {
    const updatedPlans = [...plans];
    updatedPlans[activePlanIndex].name = e.target.value;
    setPlans(updatedPlans);
    sendPlansUpdate(updatedPlans);
  };

  const handleCourseRemove = (year, idx) => {
    const updatedPlans = [...plans];
    updatedPlans[activePlanIndex].years[year].splice(idx, 1);
    setPlans(updatedPlans);
    sendPlansUpdate(updatedPlans);
  };

  const handleAddPlan = () => {
    setPlans((prev) => [
      ...prev,
      {
        name: "",
        years: {
          "9th Grade": [],
          "10th Grade": [],
          "11th Grade": [],
          "12th Grade": [],
        },
      },
    ]);
    sendPlansUpdate(plans);
    setActivePlanIndex(plans.length);
  };

  const renderComments = () => {
    const planId = plans[activePlanIndex]?.id;
    if (!planId || !comments[planId])
      return (
        <Typography
          sx={{
            color: "#94a3b8",
            fontStyle: "italic",
          }}
        >
          No comments yet.
        </Typography>
      );

    const planComments = comments[planId];
    if (planComments.length === 0)
      return (
        <Typography
          sx={{
            color: "#94a3b8",
            fontStyle: "italic",
          }}
        >
          No comments yet.
        </Typography>
      );

    return (
      <Box
        component="ul"
        sx={{
          listStyle: "none",
          p: 0,
          maxHeight: 240,
          overflowY: "auto",
          background: "rgba(255, 255, 255, 0.03)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(148, 163, 184, 0.15)",
          borderRadius: "12px",
          boxShadow: "0 8px 25px rgba(0, 0, 0, 0.2)",
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: "rgba(255, 255, 255, 0.05)",
            borderRadius: "3px",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "rgba(148, 163, 184, 0.3)",
            borderRadius: "3px",
            "&:hover": {
              background: "rgba(148, 163, 184, 0.5)",
            },
          },
        }}
      >
        {planComments
          .slice()
          .reverse()
          .map((comment, index) => (
            <li
              key={comment.id}
              style={{
                padding: "16px 20px",
                borderBottom:
                  index < planComments.length - 1
                    ? "1px solid rgba(148, 163, 184, 0.1)"
                    : "none",
                transition: "all 0.2s ease-out",
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: "600",
                  color: "#60a5fa",
                  mb: 0.5,
                  fontSize: "0.875rem",
                }}
              >
                {comment.author}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  wordBreak: "break-word",
                  color: "#ffffff",
                  lineHeight: 1.5,
                  mb: 1,
                }}
              >
                {comment.text}
              </Typography>
              {comment.created_at && (
                <Typography
                  variant="caption"
                  sx={{
                    color: "#94a3b8",
                    fontSize: "0.75rem",
                    fontWeight: "400",
                  }}
                >
                  {new Date(comment.created_at).toLocaleString()}
                </Typography>
              )}
            </li>
          ))}
      </Box>
    );
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #0f172a 0%, #1c2333 100%)",
        px: 2,
        py: 4,
        fontFamily:
          '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {/* <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', marginTop: "50px" }}>
        <h1>WebSocket Chat Test</h1>

        <div style={{ marginBottom: '20px' }}>
          <strong>Status:</strong> {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          <br />
          <strong>You are:</strong> {username}
          <br />
          <strong>Room:</strong> {new URLSearchParams(window.location.search).get('studentId') || 'jasminexu999@gmail.com'}
        </div>

        <div style={{
          border: '1px solid #ccc',
          height: '400px',
          overflowY: 'scroll',
          padding: '10px',
          marginBottom: '10px',
          backgroundColor: '#f9f9f9',
          color: 'black'
        }}>
          {messages.length === 0 ? (
            <p style={{ color: '#666' }}>No messages yet. Start typing to test!</p>
          ) : (
            messages.map(msg => (
              <div key={msg.id} style={{ marginBottom: '10px' }}>
                <strong>{msg.sender}</strong>
                <span style={{ color: '#666', fontSize: '12px', marginLeft: '10px' }}>
                  {msg.timestamp}
                </span>
                <br />
                <span>{msg.text}</span>
              </div>
            ))
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            style={{
              flex: 1,
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
            disabled={!isConnected}
          />
          <button
            onClick={sendMessage}
            disabled={!isConnected || !inputMessage.trim()}
            style={{
              padding: '10px 20px',
              backgroundColor: isConnected ? '#007bff' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isConnected ? 'pointer' : 'not-allowed'
            }}
          >
            Send
          </button>
        </div>
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <button onClick={() => {
            if (socket && isConnected) {
              socket.send(JSON.stringify({ type: 'test', data: 'Hello from frontend!' }));
            }
          }}>
            Send Test Message
          </button>

          <button onClick={() => {
            if (socket && isConnected) {
              socket.send('Raw string message');
            }
          }}>
            Send Raw String
          </button>
        </div>
      </div> */}

      <Paper
        elevation={0}
        sx={{
          p: 4,
          maxWidth: 900,
          margin: "auto",
          mt: 12,
          borderRadius: "20px",
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(148, 163, 184, 0.1)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
          position: "relative",
          "&::before": {
            content: '""',
            position: "absolute",
            top: -1,
            left: -1,
            right: -1,
            height: "2px",
            background:
              "linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.5), transparent)",
            borderRadius: "20px 20px 0 0",
          },
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontWeight: "600",
            color: "#ffffff",
            fontSize: "1.75rem",
            letterSpacing: "-0.025em",
            mb: 3,
          }}
        >
          Class Planner
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: "rgba(148, 163, 184, 0.2)" }}>
          <Tabs
            value={activePlanIndex}
            onChange={(_, newIndex) => setActivePlanIndex(newIndex)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              "& .MuiTab-root": {
                color: "#cbd5e1",
                textTransform: "none",
                fontWeight: "500",
                "&.Mui-selected": {
                  color: "#60a5fa",
                },
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "#60a5fa",
              },
            }}
          >
            {plans.map((plan, idx) => (
              <Tab
                key={idx}
                label={plan.name || `Plan ${idx + 1}`}
                sx={{ minWidth: 120 }}
              />
            ))}
            <Button
              onClick={handleAddPlan}
              size="small"
              variant="outlined"
              sx={{
                ml: 1,
                textTransform: "none",
                fontWeight: "500",
                color: "#60a5fa",
                borderColor: "rgba(96, 165, 250, 0.3)",
                borderRadius: "8px",
                "&:hover": {
                  borderColor: "#60a5fa",
                  backgroundColor: "rgba(96, 165, 250, 0.1)",
                },
              }}
            >
              + New
            </Button>
          </Tabs>
        </Box>

        {plans.length === 0 ? (
          <Typography sx={{ mt: 3, color: "#cbd5e1" }}>
            No plans found. Create one!
          </Typography>
        ) : (
          <>
            <Box sx={{ mt: 3 }}>
              <TextField
                label="Plan Name"
                value={plans[activePlanIndex].name}
                onChange={handleNameChange}
                size="small"
                sx={{
                  mb: 3,
                  width: "100%",
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    "& fieldset": {
                      borderColor: "rgba(148, 163, 184, 0.2)",
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(148, 163, 184, 0.4)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#60a5fa",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: "#cbd5e1",
                    "&.Mui-focused": {
                      color: "#60a5fa",
                    },
                  },
                  "& .MuiOutlinedInput-input": {
                    color: "#ffffff",
                  },
                }}
                placeholder="Enter a plan name"
              />

              {defaultYears.map((year) => (
                <Box key={year} sx={{ mb: 4 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 2,
                      color: "#ffffff",
                      fontWeight: "600",
                    }}
                  >
                    {year}
                  </Typography>
                  <Divider
                    sx={{ mb: 2, borderColor: "rgba(148, 163, 184, 0.2)" }}
                  />

                  {plans[activePlanIndex].years[year].length === 0 ? (
                    <Typography
                      color="text.secondary"
                      sx={{
                        fontStyle: "italic",
                        color: "#94a3b8",
                      }}
                    >
                      No courses added.
                    </Typography>
                  ) : (
                    plans[activePlanIndex].years[year].map((course, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          mb: 1,
                          p: 2,
                          backgroundColor: "rgba(255, 255, 255, 0.03)",
                          borderRadius: "8px",
                          border: "1px solid rgba(148, 163, 184, 0.1)",
                        }}
                      >
                        <Typography sx={{ flexGrow: 1, color: "#ffffff" }}>
                          {course}
                        </Typography>
                        <IconButton
                          aria-label="delete"
                          size="small"
                          onClick={() => handleCourseRemove(year, idx)}
                          sx={{
                            color: "#f87171",
                            "&:hover": {
                              backgroundColor: "rgba(248, 113, 113, 0.1)",
                            },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))
                  )}
                </Box>
              ))}

              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  alignItems: "center",
                  mb: 3,
                  flexWrap: "wrap",
                }}
              >
                <TextField
                  select
                  label="Year"
                  value={newCourse.year}
                  onChange={(e) =>
                    setNewCourse((prev) => ({ ...prev, year: e.target.value }))
                  }
                  size="small"
                  sx={{
                    minWidth: 140,
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      "& fieldset": {
                        borderColor: "rgba(148, 163, 184, 0.2)",
                      },
                      "&:hover fieldset": {
                        borderColor: "rgba(148, 163, 184, 0.4)",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#60a5fa",
                      },
                    },
                    "& .MuiInputLabel-root": {
                      color: "#cbd5e1",
                      "&.Mui-focused": {
                        color: "#60a5fa",
                      },
                    },
                    "& .MuiSelect-select": {
                      color: "#ffffff",
                    },
                    "& .MuiSvgIcon-root": {
                      color: "#cbd5e1",
                    },
                  }}
                >
                  {defaultYears.map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  label="Course Name"
                  value={newCourse.name}
                  onChange={(e) =>
                    setNewCourse((prev) => ({ ...prev, name: e.target.value }))
                  }
                  size="small"
                  sx={{
                    flexGrow: 1,
                    minWidth: 200,
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      "& fieldset": {
                        borderColor: "rgba(148, 163, 184, 0.2)",
                      },
                      "&:hover fieldset": {
                        borderColor: "rgba(148, 163, 184, 0.4)",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#60a5fa",
                      },
                    },
                    "& .MuiInputLabel-root": {
                      color: "#cbd5e1",
                      "&.Mui-focused": {
                        color: "#60a5fa",
                      },
                    },
                    "& .MuiOutlinedInput-input": {
                      color: "#ffffff",
                    },
                  }}
                />

                <Button
                  variant="outlined"
                  onClick={handleAddCourse}
                  size="small"
                  sx={{
                    textTransform: "none",
                    fontWeight: "500",
                    color: "#60a5fa",
                    borderColor: "rgba(96, 165, 250, 0.3)",
                    borderRadius: "8px",
                    "&:hover": {
                      borderColor: "#60a5fa",
                      backgroundColor: "rgba(96, 165, 250, 0.1)",
                    },
                  }}
                >
                  Add Course
                </Button>

                <Button
                  variant="contained"
                  onClick={handleSaveCourses}
                  size="small"
                  sx={{
                    background:
                      "linear-gradient(135deg, #4285F4 0%, #357ae8 100%)",
                    textTransform: "none",
                    fontWeight: "500",
                    borderRadius: "8px",
                    "&:hover": {
                      background:
                        "linear-gradient(135deg, #357ae8 0%, #2563eb 100%)",
                    },
                  }}
                >
                  Save Courses
                </Button>

                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleDeletePlan}
                  size="small"
                  sx={{
                    textTransform: "none",
                    fontWeight: "500",
                    borderRadius: "8px",
                    color: "#f87171",
                    borderColor: "rgba(248, 113, 113, 0.3)",
                    "&:hover": {
                      borderColor: "#f87171",
                      backgroundColor: "rgba(248, 113, 113, 0.1)",
                    },
                  }}
                >
                  Delete Plan
                </Button>
              </Box>

              <Box sx={{ mt: 4 }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{
                    color: "#ffffff",
                    fontWeight: "600",
                    mb: 3,
                  }}
                >
                  Comments
                </Typography>
                {renderComments()}
                <TextField
                  label="Add Comment"
                  multiline
                  fullWidth
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  sx={{
                    mt: 2,
                    mb: 2,
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      "& fieldset": {
                        borderColor: "rgba(148, 163, 184, 0.2)",
                      },
                      "&:hover fieldset": {
                        borderColor: "rgba(148, 163, 184, 0.4)",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#60a5fa",
                      },
                    },
                    "& .MuiInputLabel-root": {
                      color: "#cbd5e1",
                      "&.Mui-focused": {
                        color: "#60a5fa",
                      },
                    },
                    "& .MuiOutlinedInput-input": {
                      color: "#ffffff",
                    },
                  }}
                />
                <Button
                  variant="outlined"
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  sx={{
                    textTransform: "none",
                    fontWeight: "500",
                    color: "#60a5fa",
                    borderColor: "rgba(96, 165, 250, 0.3)",
                    borderRadius: "8px",
                    "&:hover": {
                      borderColor: "#60a5fa",
                      backgroundColor: "rgba(96, 165, 250, 0.1)",
                    },
                    "&:disabled": {
                      color: "#64748b",
                      borderColor: "rgba(100, 116, 139, 0.3)",
                    },
                  }}
                >
                  Post Comment
                </Button>
              </Box>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}
