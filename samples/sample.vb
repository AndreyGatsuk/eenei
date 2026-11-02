Module Preview
    ' Preview active projects.
    Function Label(name As String, active As Boolean) As String
        If active Then
            Return "Project: " & name
        End If
        Return "Archived"
    End Function
End Module
